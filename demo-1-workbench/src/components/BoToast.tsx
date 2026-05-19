import { useEffect } from 'react';

interface Props {
  payload: object | null;
  onClose: () => void;
}

export function BoToast({ payload, onClose }: Props) {
  useEffect(() => {
    if (!payload) return;
    const id = window.setTimeout(onClose, 6500);
    return () => clearTimeout(id);
  }, [payload, onClose]);

  if (!payload) return null;
  return (
    <div className="bo-toast">
      <div className="toast-head">
        <strong>BO Action dispatched</strong>
        <button onClick={onClose} aria-label="Close">×</button>
      </div>
      <pre className="toast-body">{JSON.stringify(payload, null, 2)}</pre>
    </div>
  );
}
