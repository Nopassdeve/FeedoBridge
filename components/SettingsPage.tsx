'use client';

import { useState, useEffect } from 'react';
import { Page, Card, FormLayout, TextField, Checkbox, Button, Banner } from '@shopify/polaris';

interface SettingsPageProps {
  shopId: string;
}

export default function SettingsPage({ shopId }: SettingsPageProps) {
  const [url, setUrl] = useState('https://feedogocloud.com');
  const [autoRegister, setAutoRegister] = useState(true);
  const [modalTitle, setModalTitle] = useState('');
  const [modalDescription, setModalDescription] = useState('');
  const [modalButtonText, setModalButtonText] = useState('');
  const [modalButtonLink, setModalButtonLink] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      const response = await fetch(`/api/settings?shop=${shopId}`);
      const data = await response.json();
      
      setUrl(data.embeddedIframeUrl || 'https://feedogocloud.com');
      setAutoRegister(data.enableAutoRegister ?? true);
      
      if (data.thankYouModalConfig) {
        setModalTitle(data.thankYouModalConfig.title || '');
        setModalDescription(data.thankYouModalConfig.description || '');
        setModalButtonText(data.thankYouModalConfig.buttonText || '');
        setModalButtonLink(data.thankYouModalConfig.buttonLink || '');
      }
    }

    loadSettings();
  }, [shopId]);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);

    const thankYouModalConfig = {
      enabled: !!(modalTitle || modalDescription),
      title: modalTitle,
      description: modalDescription,
      buttonText: modalButtonText,
      buttonLink: modalButtonLink
    };

    await fetch(`/api/settings?shop=${shopId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeddedIframeUrl: url,
        enableAutoRegister: autoRegister,
        thankYouModalConfig
      })
    });

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <Page title="FeedoBridge Settings">
      {saved && (
        <Banner status="success" onDismiss={() => setSaved(false)}>
          Settings saved successfully
        </Banner>
      )}
      
      <Card>
        <div style={{ padding: '20px' }}>
          <FormLayout>
            <TextField
              label="Embedded Website URL"
              value={url}
              onChange={setUrl}
              autoComplete="off"
              helpText="The URL of the website to embed (e.g., https://feedogocloud.com)"
            />

            <Checkbox
              label="Enable automatic customer registration"
              checked={autoRegister}
              onChange={setAutoRegister}
            />

            <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #e1e3e5' }}>
              <h3 style={{ marginBottom: '12px' }}>Thank You Page Modal</h3>
              
              <TextField
                label="Modal Title"
                value={modalTitle}
                onChange={setModalTitle}
                autoComplete="off"
              />

              <TextField
                label="Modal Description"
                value={modalDescription}
                onChange={setModalDescription}
                multiline={3}
                autoComplete="off"
              />

              <TextField
                label="Button Text"
                value={modalButtonText}
                onChange={setModalButtonText}
                autoComplete="off"
              />

              <TextField
                label="Button Link"
                value={modalButtonLink}
                onChange={setModalButtonLink}
                autoComplete="off"
              />
            </div>

            <Button primary onClick={handleSave} loading={saving}>
              Save Settings
            </Button>
          </FormLayout>
        </div>
      </Card>
    </Page>
  );
}
