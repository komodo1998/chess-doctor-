// Personalised training plans — one per major diagnosis, checkbox state persisted.

import { useMemo } from 'react';
import { useStore } from '../App';
import { EmptyState, Section } from './bits';
import { buildAllTrainingPlans } from '../core/training';

export function TrainingView() {
  const store = useStore();
  const plans = useMemo(
    () => buildAllTrainingPlans([...store.dashboard.diagnoses, ...store.dashboard.secondaryDiagnoses]),
    [store.dashboard.diagnoses, store.dashboard.secondaryDiagnoses]
  );

  if (plans.length === 0) {
    return (
      <EmptyState
        icon="🎯"
        title="No training plans yet"
        text="Training plans are generated from your recurring diagnoses. Analyze more games until patterns emerge — then each one gets a 5-day program built from your own mistakes."
      />
    );
  }

  const totalTasks = plans.reduce(
    (a, p) => a + p.days.reduce((b, day) => b + day.tasks.length, 0),
    0
  );
  const doneTasks = plans.reduce(
    (a, p) =>
      a +
      p.days.reduce(
        (b, day) =>
          b + day.tasks.filter((t, ti) => store.state.trainingChecks[`${p.diagnosisId}:${p.days.indexOf(day)}:${ti}`]).length,
        0
      ),
    0
  );

  return (
    <Section
      title="Training programs"
      subtitle={`${doneTasks}/${totalTasks} tasks done. Each plan targets one diagnosis and uses your own flagged positions as material.`}
    >
      <div className="training-list">
        {plans.map((plan) => (
          <article key={plan.diagnosisId} className="training-plan">
            <h3>{plan.title}</h3>
            {plan.days.map((day, dayIdx) => (
              <div key={day.label} className="training-day">
                <div className="training-day-head">
                  <strong>{day.label}</strong>
                  <span className="muted">{day.focus}</span>
                </div>
                <ul>
                  {day.tasks.map((task, taskIdx) => {
                    const key = `${plan.diagnosisId}:${dayIdx}:${taskIdx}`;
                    const checked = Boolean(store.state.trainingChecks[key]);
                    return (
                      <li key={key} className={checked ? 'done' : ''}>
                        <label>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => store.toggleTrainingTask(key)}
                          />
                          <span>{task.text}</span>
                        </label>
                        {task.gameId !== undefined && task.ply !== undefined && (
                          <button className="btn ghost tiny" onClick={() => store.openPosition(task.gameId as string, task.ply as number)}>
                            open position
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </article>
        ))}
      </div>
    </Section>
  );
}
