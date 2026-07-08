import { useAuth } from '../context/AuthContext';

export default function FlashMessage() {
  const { flash, clearFlash } = useAuth();

  if (!flash) return null;

  return (
    <div className="flash-container" role="alert" aria-live="polite">
      <div className={`flash ${flash.type}`}>
        <span>{flash.message}</span>
        <button
          className="flash-close"
          onClick={clearFlash}
          aria-label="Dismiss notification"
          id="flash-close-btn"
        >
          &times;
        </button>
      </div>
    </div>
  );
}
