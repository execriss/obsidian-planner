import styles from './SectionSkeleton.module.css';

function Sh({ className }) {
  return <div className={`${styles.shimmer} ${className}`} />;
}

function SkeletonHeader() {
  return (
    <div className={styles.header}>
      <div className={styles.headerLeft}>
        <Sh className={styles.headerIcon} />
        <div className={styles.headerText}>
          <Sh className={styles.titleLine} />
          <Sh className={styles.subtitleLine} />
        </div>
      </div>
      <Sh className={styles.headerBtn} />
    </div>
  );
}

function NotesSkeleton() {
  return (
    <div className={`${styles.wrap} ${styles.wrapNotes}`}>
      <SkeletonHeader />
      <div className={styles.cardGrid}>
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className={styles.card}>
            <Sh className={styles.cardTitle} />
            <Sh className={styles.cardLine} />
            <Sh className={styles.cardLine} />
            <Sh className={styles.cardLineShort} />
            <Sh className={styles.cardFooter} />
          </div>
        ))}
      </div>
    </div>
  );
}

function HabitsSkeleton() {
  return (
    <div className={`${styles.wrap} ${styles.wrapHabits}`}>
      <SkeletonHeader />
      <div className={styles.habitList}>
        {[1, 2, 3].map(i => (
          <div key={i} className={styles.habitCard}>
            <Sh className={styles.habitCircle} />
            <div className={styles.habitBody}>
              <Sh className={styles.habitName} />
              <div className={styles.habitDots}>
                {[1, 2, 3, 4, 5, 6, 7].map(j => (
                  <Sh key={j} className={styles.dot} />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RowsSkeleton({ count = 5 }) {
  return (
    <div className={`${styles.wrap} ${styles.wrapRows}`}>
      <SkeletonHeader />
      <div className={styles.rowList}>
        {Array.from({ length: count }, (_, i) => (
          <div key={i} className={styles.row}>
            <Sh className={styles.rowIcon} />
            <div className={styles.rowBody}>
              <Sh className={styles.rowTitle} />
              <Sh className={styles.rowSub} />
            </div>
            <Sh className={styles.rowBadge} />
          </div>
        ))}
      </div>
    </div>
  );
}

function ServicesSkeleton() {
  return (
    <div className={`${styles.wrap} ${styles.wrapServices}`}>
      <SkeletonHeader />
      <div className={styles.serviceGrid}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} className={styles.serviceCard}>
            <div className={styles.serviceIconRow}>
              <Sh className={styles.serviceIcon} />
              <Sh className={styles.serviceName} />
            </div>
            <Sh className={styles.serviceAmount} />
            <Sh className={styles.serviceStatus} />
          </div>
        ))}
      </div>
    </div>
  );
}

function BudgetSkeleton() {
  return (
    <div className={styles.budgetWrap}>
      {/* Header */}
      <div className={styles.budgetHeader}>
        <Sh className={styles.budgetHeaderIcon} />
        <div className={styles.headerText}>
          <Sh className={styles.titleLine} />
          <Sh className={styles.subtitleLine} />
        </div>
      </div>

      {/* Income cards */}
      <div className={styles.budgetIncomeLabel}>
        <Sh className={styles.budgetSectionLabel} />
      </div>
      <div className={styles.budgetIncomeRow}>
        {[1, 2, 3].map(i => (
          <div key={i} className={styles.budgetIncomeCard}>
            <Sh className={styles.budgetIncomeSource} />
            <Sh className={styles.budgetIncomeAmount} />
          </div>
        ))}
      </div>

      {/* Summary bar */}
      <div className={styles.budgetSummaryBar}>
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className={styles.budgetSummaryCell}>
            <Sh className={styles.budgetSummaryLabel} />
            <Sh className={styles.budgetSummaryValue} />
          </div>
        ))}
      </div>

      {/* Category sections */}
      {[6, 4, 3].map((itemCount, i) => (
        <div key={i} className={styles.budgetCategory}>
          <div className={styles.budgetCategoryHeader}>
            <Sh className={styles.budgetCategoryDot} />
            <Sh className={styles.budgetCategoryName} />
            <Sh className={styles.budgetCategoryTotals} />
          </div>
          <div className={styles.budgetItemList}>
            {Array.from({ length: itemCount }, (_, j) => (
              <div key={j} className={styles.budgetItemRow}>
                <Sh className={styles.budgetItemName} />
                <Sh className={styles.budgetItemAmount} />
                <Sh className={styles.budgetItemPaid} />
                <Sh className={styles.budgetItemBtn} />
                <Sh className={styles.budgetItemBtn} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function SectionSkeleton({ variant = 'rows', count }) {
  if (variant === 'notes')    return <NotesSkeleton />;
  if (variant === 'habits')   return <HabitsSkeleton />;
  if (variant === 'services') return <ServicesSkeleton />;
  if (variant === 'budget')   return <BudgetSkeleton />;
  return <RowsSkeleton count={count} />;
}
