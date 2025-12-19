import React, { useEffect, useState, useCallback } from 'react';
import ColumnLayout from '@splunk/react-ui/ColumnLayout';
import Button from '@splunk/react-ui/Button';
import Text from '@splunk/react-ui/Text';
import Heading from '@splunk/react-ui/Heading';
import Table from '@splunk/react-ui/Table';
import WaitSpinner from '@splunk/react-ui/WaitSpinner';
import Message from '@splunk/react-ui/Message';
import ControlGroup from '@splunk/react-ui/ControlGroup';
import Modal from '@splunk/react-ui/Modal';
import * as config from '@splunk/splunk-utils/config';

/**
 * Get CSRF token using the correct Splunk method
 */
function getCSRFToken() {
  if (typeof config.getCSRFToken === 'function') {
    const token = config.getCSRFToken();
    if (token) return token;
  }
  if (config.CSRFToken) return config.CSRFToken;
  return null;
}

/**
 * Helper for calling Splunkd via Splunk Web proxy with proper security.
 */
async function splunkd(method, path, body) {
  const csrfToken = getCSRFToken();
  
  if (!csrfToken) {
    throw new Error('CSRF token not available. Please refresh the page.');
  }

  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
    'X-Splunk-Form-Key': csrfToken,
    'X-Requested-With': 'XMLHttpRequest',
  };

  const res = await fetch(`/splunkd/__raw${path}`, {
    method,
    headers,
    credentials: 'include',
    body,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`${method} ${path} failed (${res.status}): ${errText.substring(0, 200)}`);
  }

  return res.text();
}

/**
 * Parse Splunk XML response to extract stanzas
 */
function parseStanzasFromXml(xml) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'text/xml');
  const entries = doc.querySelectorAll('entry');
  
  const stanzas = [];
  entries.forEach(entry => {
    const titleEl = entry.querySelector('title');
    const title = titleEl?.textContent || '';
    
    // Skip default stanza
    if (title === 'default') return;
    
    const content = {};
    const contentEl = entry.querySelector('content');
    if (contentEl) {
      const keys = contentEl.querySelectorAll('s\\:key, key');
      keys.forEach(key => {
        const name = key.getAttribute('name');
        const value = key.textContent;
        if (name && name !== 'eai:acl' && name !== 'eai:appName') {
          content[name] = value;
        }
      });
    }
    
    stanzas.push({ name: title, ...content });
  });
  
  return stanzas;
}

/**
 * Validate GitLab URL
 */
function validateGitLabUrl(url) {
  try {
    const parsed = new URL(url);
    if (!parsed.protocol.startsWith('http')) {
      return 'URL must start with http:// or https://';
    }
    return null;
  } catch (e) {
    return 'Invalid URL format';
  }
}

export default function GitLabConfigManager() {
  const owner = 'nobody';
  const app = 'splunk
