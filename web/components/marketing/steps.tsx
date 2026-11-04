import { steps } from "@/configs/marketing";
import { SectionHeading } from "./section-heading";
import { StepStack } from "./step-stack";
import { ImportVisual, PlanVisual, ProVisual, ReviewVisual } from "./visuals/step-visuals";

const visuals = [ImportVisual, ReviewVisual, PlanVisual, ProVisual];

export function Steps() {
  return (
    <section aria-labelledby="how-title" id="how" className="page py-20 sm:py-28">
      <SectionHeading
        id="how-title"
        title="From a statement to a plan in four steps"
        description="The same flow runs in the demo app and through the API inside a bank's own product."
      />

      <StepStack>
        {steps.map((step, i) => {
          const Visual = visuals[i];
          const last = i === steps.length - 1;
          return (
            <li
              key={step.number}
              className={last ? "md:sticky" : "md:sticky md:pb-24"}
              style={{ top: `calc(6rem + ${i * 1.25}rem)` }}
            >
              <article
                data-step-card
                aria-labelledby={`step-${step.number}`}
                className="step-card grid overflow-hidden rounded-[var(--radius-card)] border border-line-strong bg-panel md:h-[440px] md:grid-cols-2"
              >
                <div className="flex flex-col p-7 sm:p-10">
                  <p
                    aria-hidden="true"
                    className="text-[72px] font-[650] leading-none tracking-[-0.06em] text-t4 sm:text-[104px]"
                  >
                    {step.number}
                  </p>
                  <div className="mt-10 md:mt-auto">
                    <h3
                      id={`step-${step.number}`}
                      className="text-[22px] font-semibold tracking-[-0.03em] sm:text-[24px]"
                    >
                      <span className="sr-only">Step {i + 1}: </span>
                      {step.title}
                    </h3>
                    <p className="mt-3 max-w-md text-[15px] leading-relaxed text-t3">
                      {step.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-center border-t border-line bg-panel-raised/50 px-6 pt-14 pb-10 md:border-t-0 md:border-l md:p-10">
                  <Visual />
                </div>
              </article>
            </li>
          );
        })}
      </StepStack>
    </section>
  );
}
