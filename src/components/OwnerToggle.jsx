import { Users } from 'lucide-react';
import styles from './OwnerToggle.module.css';

export default function OwnerToggle({ sharedOwners, activeOwnerId, onSelect }) {
  if (!sharedOwners || sharedOwners.length === 0) return null;

  return (
    <div className={styles.wrapper}>
      <Users size={11} className={styles.icon} />
      <div className={styles.track}>
        <button
          onClick={() => onSelect(null)}
          className={`${styles.option} ${activeOwnerId === null ? styles.optionActive : ''}`}
        >
          Mío
        </button>
        {sharedOwners.map(owner => (
          <button
            key={owner.id}
            onClick={() => onSelect(owner.id)}
            className={`${styles.option} ${activeOwnerId === owner.id ? styles.optionActive : ''}`}
            title={owner.email}
          >
            {owner.email.split('@')[0]}
          </button>
        ))}
      </div>
    </div>
  );
}
