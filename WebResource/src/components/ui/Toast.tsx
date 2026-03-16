import React from 'react';

interface Props {
  message: string;
  visible: boolean;
}

const Toast: React.FC<Props> = ({ message, visible }) => (
  <div className={`toast ${visible ? 'toast-visible' : ''}`} role="status" aria-live="polite">
    {message}
  </div>
);

export default Toast;
