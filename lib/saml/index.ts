import { IdentityProvider, SAMLConfig } from '@/types/organization';
import * as samlify from 'samlify';
import { deflateRawSync } from 'zlib';

import { DOMParser } from '@xmldom/xmldom';

export function setupSAMLValidator() {
  samlify.setSchemaValidator({
    validate: (xml: string) => {
      try {
        new DOMParser().parseFromString(xml);
        return Promise.resolve('success');
      } catch (err) {
        return Promise.reject(new Error('Invalid XML', { cause: err }));
      }
    }
  });
}

export function generateLoginURL(config: SAMLConfig, orgId: string, redirectURL = '') {
  const orgIdEncoded = encodeURIComponent(
    Buffer.from(JSON.stringify({ orgId, redirectURL })).toString('base64')
  );

  // okta
  if (config.idP === IdentityProvider.Okta) {
    return `${config.entryPoint}?RelayState=${orgIdEncoded}`;
  }

  const id = `_${Math.random().toString(36).substr(2, 9)}`;
  const issueInstant = new Date().toISOString();

  const samlRequest = `<?xml version="1.0" encoding="UTF-8"?>
<samlp:AuthnRequest xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" 
  xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion" 
  ID="${id}" 
  Version="2.0" 
  IssueInstant="${issueInstant}" 
  Destination="${config.entryPoint}"
  AssertionConsumerServiceURL="${config.callbackURL}"
  ProtocolBinding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST">
  <saml:Issuer>${config.issuer}</saml:Issuer>
</samlp:AuthnRequest>`;

  // Use deflateRawSync instead of deflateSync
  const deflated = deflateRawSync(samlRequest);
  const encoded = deflated.toString('base64');
  const urlEncoded = encodeURIComponent(encoded);

  return `${config.entryPoint}?SAMLRequest=${urlEncoded}&RelayState=${orgIdEncoded}`;
}

// Initializes service provider (us)
export function initServiceProvider(callbackURL: string) {
  return samlify.ServiceProvider({
    entityID: `${process.env.NEXT_PUBLIC_APP_URL}/saml/metadata`,
    assertionConsumerService: [
      {
        Binding: samlify.Constants.BindingNamespace.Post,
        Location: callbackURL
      }
    ],
    singleLogoutService: [
      {
        Binding: samlify.Constants.BindingNamespace.Redirect,
        Location: `${process.env.NEXT_PUBLIC_APP_URL}/saml/logout`
      }
    ]
  });
}

// Initializes identify provider with saml config
export function initIdentityProvider(config: SAMLConfig, redirectBinding = false) {
  const formattedCert = `-----BEGIN CERTIFICATE-----\n${config.certificate}\n-----END CERTIFICATE-----`;

  return samlify.IdentityProvider({
    entityID: config.entityId,
    singleSignOnService: [
      {
        Binding: redirectBinding
          ? samlify.Constants.BindingNamespace.Redirect
          : samlify.Constants.BindingNamespace.Post,
        Location: config.entryPoint
      }
    ],
    singleLogoutService: [
      {
        Binding: samlify.Constants.BindingNamespace.Redirect,
        Location: config.logoutURL || config.callbackURL.split('/api')[0]
      }
    ],
    signingCert: formattedCert
  });
}
