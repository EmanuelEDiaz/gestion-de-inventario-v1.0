'use client';

import { useState, useEffect } from 'react';
import { useUserDirectory } from '../hooks/useUserDirectory';
import { useSendMessage } from '../hooks/useSendMessage';
import { MessageRecipientSelector } from './MessageRecipientSelector';
import { MessageComposer } from './MessageComposer';
import { MessagePreview } from './MessagePreview';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function ComposeMessageDialog({ open, onClose }: Props) {
  const [targetUserId, setTargetUserId] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const { data: users = [], isLoading: loadingUsers } = useUserDirectory();
  const sendMessage = useSendMessage();

  const userOptions = users.map((u) => ({
    value: u.id,
    label: `${u.displayName} (@${u.username})`,
  }));

  const canSend = targetUserId.trim() !== '' && title.trim() !== '' && body.trim() !== '';

  function resetForm() {
    setTargetUserId('');
    setTitle('');
    setBody('');
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  function handleSend() {
    if (!canSend) return;
    sendMessage.mutate(
      { title: title.trim(), body: body.trim(), targetUserId },
      {
        onSuccess: () => {
          resetForm();
          onClose();
        },
      }
    );
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  if (!open) return null;

  return (
    <MessagePreview
      onClose={handleClose}
      onSend={handleSend}
      canSend={canSend}
      isSending={sendMessage.isPending}
    >
      <MessageRecipientSelector
        targetUserId={targetUserId}
        onChange={setTargetUserId}
        loadingUsers={loadingUsers}
        userOptions={userOptions}
      />
      <MessageComposer
        title={title}
        body={body}
        onTitleChange={setTitle}
        onBodyChange={setBody}
      />
    </MessagePreview>
  );
}
