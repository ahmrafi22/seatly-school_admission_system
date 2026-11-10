import { useState } from "react";
import {
  RiAddLine,
  RiCheckLine,
  RiErrorWarningLine,
  RiTimeLine,
} from "@remixicon/react";
import { Button } from "@/components/base/buttons/button";
import { Chip } from "@/components/base/badges/chip";
import { Skeleton } from "@/components/base/skeleton/skeleton";
import { useI18n } from "@/src/i18n/LanguageProvider";
import type { ClassSummary, HoldStatus } from "@/src/lib/api";
import { localizeDigits } from "@/src/lib/format";
import { SeatBar } from "@/src/components/SeatBar";

export interface ClassCardProps {
  cls: ClassSummary;
  /** This student's relationship to the class, if any. */
  myStatus?: HoldStatus;
  onApply: (cls: ClassSummary) => void;
  isApplying: boolean;
  /** True while another apply is in flight, so only one can run. */
  isBusy: boolean;
}

export function ClassCard({ cls, myStatus, onApply, isApplying, isBusy }: ClassCardProps) {
  const { t, isBangla } = useI18n();
  const [hovered, setHovered] = useState(false);

  const full = cls.availableSeats <= 0;
  // "Almost full" only means something once seats are actually gone: a class
  // with one seat and one free seat is empty, not nearly full.
  const taken = cls.heldSeats + cls.confirmedSeats;
  const almostFull =
    !full && taken > 0 && cls.availableSeats <= Math.max(1, Math.round(cls.totalSeats * 0.1));

  const hasActiveHold = myStatus === "HELD";
  const hasConfirmed = myStatus === "CONFIRMED";

  const n = (value: number) => localizeDigits(value, isBangla ? "bn" : "en");

  return (
    <article
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group relative flex flex-col rounded-3xl border border-border-button-default bg-background-primary-default p-5 shadow-card transition-[transform,box-shadow,border-color] duration-300 ease-out hover:-translate-y-0.5 hover:border-border-button-hover hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-title-3-semibold text-text-primary">
            <span className="line-clamp-2">{cls.name}</span>
          </h3>
          <p className="mt-1 text-caption-1-medium text-text-tertiary">
            {n(cls.totalSeats)} {t.common.seats}
          </p>
        </div>

        {hasConfirmed ? (
          <Chip color="lime" variant="bold" className="shrink-0 gap-1">
            <RiCheckLine className="size-3" aria-hidden />
            {t.mine.statusConfirmed}
          </Chip>
        ) : hasActiveHold ? (
          <Chip color="cyan" variant="bold" className="shrink-0 gap-1">
            <RiTimeLine className="size-3" aria-hidden />
            {t.mine.statusHeld}
          </Chip>
        ) : full ? (
          <Chip color="neutral" variant="bold" className="shrink-0">
            {t.classes.full}
          </Chip>
        ) : almostFull ? (
          <Chip color="orange" variant="bold" className="shrink-0 gap-1">
            <RiErrorWarningLine className="size-3" aria-hidden />
            {t.classes.almostFull}
          </Chip>
        ) : null}
      </div>

      {/* The figure is the reason the card exists, so it is the largest thing
          on it after the name. */}
      <div className="mt-5 flex items-end justify-between gap-4">
        <div>
          <span
            className={
              full
                ? "text-figure text-[2rem] text-text-tertiary"
                : "text-figure text-[2rem] text-text-primary"
            }
          >
            {n(Math.max(0, cls.availableSeats))}
          </span>
          <span className="ms-1.5 text-body-regular text-text-secondary">
            {t.classes.availableLabel}
          </span>
        </div>

        <dl className="flex items-center gap-3 text-caption-1-medium">
          <div className="flex items-center gap-1.5">
            <span
              aria-hidden
              className="size-2 rounded-[3px] bg-seat-confirmed"
            />
            <dt className="sr-only">{t.classes.confirmed}</dt>
            <dd className="tabular text-text-secondary">{n(cls.confirmedSeats)}</dd>
          </div>
          <div className="flex items-center gap-1.5">
            <span aria-hidden className="size-2 rounded-[3px] bg-seat-held" />
            <dt className="sr-only">{t.classes.held}</dt>
            <dd className="tabular text-text-secondary">{n(cls.heldSeats)}</dd>
          </div>
        </dl>
      </div>

      <SeatBar cls={cls} className="mt-2.5" />

      <div className="mt-5">
        {hasConfirmed ? (
          <Button variant="secondary" size="medium" className="h-10 w-full" disabled>
            <RiCheckLine className="size-4" aria-hidden />
            {t.mine.statusConfirmed}
          </Button>
        ) : hasActiveHold ? (
          <Button
            variant="secondary"
            size="medium"
            className="h-10 w-full"
            onClick={() => onApply(cls)}
            disabled={isBusy}
          >
            {t.classes.yourHold}
          </Button>
        ) : (
          <Button
            variant="primary"
            size="medium"
            className="h-10 w-full"
            onClick={() => onApply(cls)}
            disabled={full || isBusy}
            aria-busy={isApplying || undefined}
            leadingIcon={isApplying ? undefined : RiAddLine}
          >
            {isApplying
              ? t.classes.applying
              : full
                ? t.classes.full
                : t.classes.apply}
          </Button>
        )}
      </div>

      {/* A hairline that warms on hover, so the card answers the pointer
          without moving its content. */}
      <span
        aria-hidden
        className={
          hovered
            ? "pointer-events-none absolute inset-x-5 bottom-0 h-px bg-accent-400 opacity-100 transition-opacity duration-300"
            : "pointer-events-none absolute inset-x-5 bottom-0 h-px bg-transparent opacity-0 transition-opacity duration-300"
        }
      />
    </article>
  );
}

export function ClassCardSkeleton() {
  return (
    <div className="flex flex-col rounded-3xl border border-border-button-default bg-background-primary-default p-5">
      <Skeleton shape="text" className="h-5 w-3/5 rounded-md" />
      <Skeleton shape="text" className="mt-2 h-3 w-2/5 rounded-md" />
      <Skeleton shape="text" className="mt-6 h-8 w-1/3 rounded-md" />
      <Skeleton shape="rect" className="mt-3 h-2.5 w-full rounded-full" />
      <Skeleton shape="rect" className="mt-5 h-10 w-full rounded-2lg" />
    </div>
  );
}
