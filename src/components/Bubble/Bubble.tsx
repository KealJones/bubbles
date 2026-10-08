import styles from './Bubble.module.css';

export function Bubble({ id, register, onPopped }: {
  id: number;
  register: (id: number, element: HTMLButtonElement | null) => void;
  onPopped: (id: number) => void;
}) {
  return (
    <button
      aria-label="Pop bubble"
      className={styles.bubble}
      ref={(element) => register(id, element)}
      onClick={() => onPopped(id)}
      type="button"
    />
  );
}
