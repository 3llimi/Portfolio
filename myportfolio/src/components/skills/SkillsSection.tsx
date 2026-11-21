"use client";
import Image from "next/image";
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  AnimatePresence,
  animate,
  motion,
  useDragControls,
  useInView,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type PanInfo,
  type Variants,
} from "framer-motion";
import styles from "./SkillsSection.module.css";
import { SectionBackdrop, ui, WaveText } from "@/components/ui/ui";
import { reveal } from "@/components/ui/useScrollReveal";
import { GITHUB_PROFILE, PROJECTS, SKILL_GROUPS, type Skill, type SkillGroup } from "@/data/skillsData";

const getImagePath = (path: string) => `${process.env.NEXT_PUBLIC_BASE_PATH || ""}${path}`;

type FlatSkill = Skill & { group: SkillGroup };

const FLAT_SKILLS: FlatSkill[] = SKILL_GROUPS.flatMap((group) => group.items.map((skill) => ({ ...skill, group })));
const MARQUEE_ROWS = [
  FLAT_SKILLS.filter((_, i) => i % 2 === 0),
  FLAT_SKILLS.filter((_, i) => i % 2 === 1),
];
const FILTERS = [{ id: "all", label: "All" }, ...SKILL_GROUPS.map((g) => ({ id: g.id, label: g.filterLabel }))];

const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];

const pad2 = (n: number) => n.toString().padStart(2, "0");
const repoPath = (url: string) => url.replace("https://github.com/", "");

function CountUp({ to }: { to: number }) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const value = useMotionValue(0);
  const rounded = useTransform(value, (v) => pad2(Math.round(v)));

  useEffect(() => {
    if (!inView) return;
    const controls = animate(value, to, { duration: 1.4, ease: EASE_OUT });
    return () => controls.stop();
  }, [inView, to, value]);

  return <motion.span ref={ref}>{rounded}</motion.span>;
}

/* ------------------------------------------------------------------ */
/* Card                                                                */
/* ------------------------------------------------------------------ */

function SkillCard({
  group,
  index,
  dimmed,
  highlighted,
  reduceMotion,
  selectedLabel,
  onSelect,
}: {
  group: SkillGroup;
  index: number;
  dimmed: boolean;
  highlighted: boolean;
  reduceMotion: boolean;
  selectedLabel: string | null;
  onSelect: (skill: Skill, trigger: HTMLButtonElement) => void;
}) {
  const cardRef = useRef<HTMLDivElement | null>(null);

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    card.style.setProperty("--mx", `${event.clientX - rect.left}px`);
    card.style.setProperty("--my", `${event.clientY - rect.top}px`);
  };

  // Each card reveals as it scrolls in (CSS, see useScrollReveal); side-by-side cards are staggered.
  // Its chips then pop in one after another (chipItem in the CSS module).
  return (
    <div className={`${styles.cardSlot} ${group.wide ? styles.cardWide : ""}`} {...reveal((index % 2) * 0.12)}>
      <motion.article
        ref={cardRef}
        className={`${styles.card} ${highlighted ? styles.cardHighlighted : ""} ${dimmed ? styles.cardDimmed : ""}`}
        data-perch="Skills"
        onPointerMove={handlePointerMove}
        // Greyscale is a CSS class: a permanent `grayscale(0)` filter would still cost a render pass
        animate={{
          opacity: dimmed ? 0.28 : 1,
          scale: dimmed ? 0.97 : 1,
        }}
        transition={{ duration: 0.45, ease: EASE_OUT }}
      >
        <div className={styles.cardHeader}>
          <span className={styles.cardIndex}>{pad2(index + 1)}</span>
          <span className={styles.cardCount}>
            {group.items.length} {group.items.length === 1 ? "tool" : "tools"}
          </span>
        </div>

        <div className={styles.cardBody}>
          <div className={styles.cardText}>
            <h3 className={styles.cardTitle}>
              <span className={styles.star} aria-hidden="true">*</span>
              {group.title}
            </h3>
            <p className={styles.cardBlurb}>{group.blurb}</p>
          </div>

          <ul className={styles.chipList}>
            {group.items.map((skill, chipIndex) => (
              <li
                key={skill.label}
                className={styles.chipItem}
                style={{ ["--ci" as string]: chipIndex } as React.CSSProperties}
              >
                <motion.button
                  type="button"
                  className={`${styles.chip} ${selectedLabel === skill.label ? styles.chipSelected : ""}`}
                  data-skill-chip
                  onClick={(event) => onSelect(skill, event.currentTarget)}
                  aria-haspopup="dialog"
                  aria-label={`${skill.label}: see where I used it`}
                  whileHover={reduceMotion ? undefined : { y: -4 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 22 }}
                >
                  <span className={styles.chipIcon}>
                    <Image src={getImagePath(skill.icon)} alt="" width={22} height={22} />
                  </span>
                  <span className={styles.chipLabel}>{skill.label}</span>
                  {skill.uses.length > 0 && <span className={styles.chipCount}>{skill.uses.length}</span>}
                </motion.button>
              </li>
            ))}
          </ul>
        </div>
      </motion.article>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Detail panel                                                        */
/* ------------------------------------------------------------------ */

function SkillDetail({
  index,
  direction,
  origin,
  isSheet,
  reduceMotion,
  onClose,
  onNavigate,
}: {
  index: number;
  direction: number;
  origin: { x: number; y: number } | null;
  isSheet: boolean;
  reduceMotion: boolean;
  onClose: () => void;
  onNavigate: (delta: number) => void;
}) {
  const skill = FLAT_SKILLS[index];
  const prev = FLAT_SKILLS[(index - 1 + FLAT_SKILLS.length) % FLAT_SKILLS.length];
  const next = FLAT_SKILLS[(index + 1) % FLAT_SKILLS.length];
  const uses = [...skill.uses].sort((a, b) => PROJECTS[b.project].year - PROJECTS[a.project].year);

  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const bodyInnerRef = useRef<HTMLDivElement | null>(null);
  const [bodyHeight, setBodyHeight] = useState<number | "auto">("auto");
  const dragControls = useDragControls();
  const startSheetDrag = (event: React.PointerEvent) => {
    if (isSheet) dragControls.start(event);
  };

  // Grow the dialog out of the chip that was clicked.
  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || isSheet || !origin) return;
    const left = (window.innerWidth - dialog.offsetWidth) / 2;
    const top = (window.innerHeight - dialog.offsetHeight) / 2;
    dialog.style.transformOrigin = `${origin.x - left}px ${origin.y - top}px`;
  }, [isSheet, origin]);

  // Animate the body's height smoothly when switching between skills.
  useEffect(() => {
    const inner = bodyInnerRef.current;
    if (!inner) return;
    const observer = new ResizeObserver(() => setBodyHeight(inner.offsetHeight));
    observer.observe(inner);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    closeRef.current?.focus({ preventScroll: true });
  }, []);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 120 || info.velocity.y > 600) onClose();
  };

  const contentVariants: Variants = {
    enter: (dir: number) => ({ opacity: 0, x: reduceMotion ? 0 : dir * 28 }),
    center: { opacity: 1, x: 0, transition: { duration: 0.32, ease: EASE_OUT, staggerChildren: 0.06, delayChildren: 0.05 } },
    exit: (dir: number) => ({ opacity: 0, x: reduceMotion ? 0 : dir * -28, transition: { duration: 0.18, ease: "easeIn" } }),
  };

  const rowVariants: Variants = {
    enter: { opacity: 0, y: 12 },
    center: { opacity: 1, y: 0, transition: { duration: 0.35, ease: EASE_OUT } },
    exit: { opacity: 0 },
  };

  const dialogMotion = isSheet
    ? {
        initial: { y: "100%" },
        animate: { y: 0, transition: { type: "spring" as const, stiffness: 320, damping: 34 } },
        exit: { y: "100%", transition: { duration: 0.25, ease: "easeIn" as const } },
      }
    : {
        initial: { opacity: 0, scale: 0.6, filter: "blur(12px)" },
        animate: {
          opacity: 1,
          scale: 1,
          filter: "blur(0px)",
          transition: { type: "spring" as const, stiffness: 300, damping: 30, mass: 0.9 },
        },
        exit: { opacity: 0, scale: 0.85, filter: "blur(8px)", transition: { duration: 0.2, ease: "easeIn" as const } },
      };

  return (
    <motion.div
      className={`${styles.overlay} ${isSheet ? styles.overlaySheet : ""}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.25 } }}
      onClick={onClose}
    >
      <motion.div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="skill-detail-title"
        className={`${styles.dialog} ${isSheet ? styles.dialogSheet : ""}`}
        onClick={(event) => event.stopPropagation()}
        drag={isSheet ? "y" : false}
        dragListener={false}
        dragControls={dragControls}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.7 }}
        onDragEnd={isSheet ? handleDragEnd : undefined}
        {...dialogMotion}
      >
        <div className={styles.dialogGlow} aria-hidden="true" />
        {isSheet && <div className={styles.sheetHandle} aria-hidden="true" onPointerDown={startSheetDrag} />}

        {/* Header (also the drag handle for the mobile sheet) */}
        <div className={styles.dialogHeader} onPointerDown={startSheetDrag}>
          <AnimatePresence mode="popLayout" custom={direction} initial={false}>
            <motion.div
              key={skill.label}
              className={styles.dialogHeading}
              custom={direction}
              variants={contentVariants}
              initial="enter"
              animate="center"
              exit="exit"
            >
              <motion.span
                className={styles.dialogIcon}
                initial={{ scale: 0.4, rotate: -25, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 380, damping: 18, delay: 0.05 }}
              >
                <Image src={getImagePath(skill.icon)} alt="" width={36} height={36} />
              </motion.span>
              <div className={styles.dialogTitleWrap}>
                <span className={styles.dialogEyebrow}>
                  <span className={styles.star} aria-hidden="true">*</span>
                  {skill.group.title}
                </span>
                <h3 id="skill-detail-title" className={styles.dialogTitle}>
                  {skill.label}
                </h3>
                <span className={styles.dialogMeta}>
                  {uses.length > 0
                    ? `Used in ${uses.length} ${uses.length === 1 ? "project" : "projects"}`
                    : "No public project yet"}
                </span>
              </div>
            </motion.div>
          </AnimatePresence>

          <button ref={closeRef} type="button" className={styles.dialogClose} onClick={onClose} aria-label="Close">
            <span aria-hidden="true" />
          </button>
        </div>

        {/* Project timeline */}
        <motion.div
          className={styles.dialogBody}
          animate={{ height: bodyHeight }}
          transition={{ duration: 0.35, ease: EASE_OUT }}
        >
          <div ref={bodyInnerRef} className={styles.dialogBodyInner}>
            <AnimatePresence mode="wait" custom={direction} initial={false}>
              <motion.div
                key={skill.label}
                custom={direction}
                variants={contentVariants}
                initial="enter"
                animate="center"
                exit="exit"
              >
                {uses.length > 0 ? (
                  <ol className={styles.timeline}>
                    {uses.map((use) => {
                      const project = PROJECTS[use.project];
                      return (
                        <motion.li key={use.project} className={styles.timelineItem} variants={rowVariants}>
                          <span className={styles.timelineDot} aria-hidden="true" />
                          <a className={styles.projectRow} href={project.url} target="_blank" rel="noopener noreferrer">
                            <span className={styles.projectTop}>
                              <span className={styles.projectYear}>{project.year}</span>
                              <span className={styles.projectName}>{project.name}</span>
                              <span className={styles.projectKind}>{project.kind}</span>
                            </span>
                            <span className={styles.projectNote}>{use.note}</span>
                            <span className={styles.projectLink}>
                              {repoPath(project.url)}
                              <span className={styles.projectArrow} aria-hidden="true">↗</span>
                            </span>
                          </a>
                        </motion.li>
                      );
                    })}
                  </ol>
                ) : (
                  <motion.div className={styles.emptyState} variants={rowVariants}>
                    <p>None of my public repositories use {skill.label} yet.</p>
                    <a href={GITHUB_PROFILE} target="_blank" rel="noopener noreferrer" className={styles.projectLink}>
                      Browse all my repositories
                      <span className={styles.projectArrow} aria-hidden="true">↗</span>
                    </a>
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Prev / next */}
        <div className={styles.dialogFooter}>
          <button type="button" className={styles.navButton} onClick={() => onNavigate(-1)} aria-label={`Previous: ${prev.label}`}>
            <span className={styles.navArrow} aria-hidden="true">←</span>
            <span className={styles.navIcon}>
              <Image src={getImagePath(prev.icon)} alt="" width={16} height={16} />
            </span>
            <span className={styles.navLabel}>{prev.label}</span>
          </button>
          <span className={styles.navCounter}>
            {pad2(index + 1)} / {pad2(FLAT_SKILLS.length)}
          </span>
          <button
            type="button"
            className={`${styles.navButton} ${styles.navButtonNext}`}
            onClick={() => onNavigate(1)}
            aria-label={`Next: ${next.label}`}
          >
            <span className={styles.navLabel}>{next.label}</span>
            <span className={styles.navIcon}>
              <Image src={getImagePath(next.icon)} alt="" width={16} height={16} />
            </span>
            <span className={styles.navArrow} aria-hidden="true">→</span>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Marquee                                                             */
/* ------------------------------------------------------------------ */

function MarqueeRow({ items, reverse }: { items: Skill[]; reverse?: boolean }) {
  // Content is rendered twice so the CSS animation can loop seamlessly at -50%.
  const loop = [...items, ...items];
  return (
    <div className={styles.marqueeRow}>
      <div className={`${styles.marqueeTrack} ${reverse ? styles.marqueeReverse : ""}`}>
        {loop.map((skill, i) => (
          <span key={`${skill.label}-${i}`} className={styles.marqueeItem} aria-hidden={i >= items.length}>
            <span className={styles.marqueeIcon}>
              <Image src={getImagePath(skill.icon)} alt="" width={20} height={20} />
            </span>
            {skill.label}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Section                                                             */
/* ------------------------------------------------------------------ */

export const skillsSectionClassName = styles.section;

export default function SkillsSection() {
  const [activeFilter, setActiveFilter] = useState("all");
  const [selected, setSelected] = useState<{ index: number; direction: number } | null>(null);
  const [origin, setOrigin] = useState<{ x: number; y: number } | null>(null);
  const [isSheet, setIsSheet] = useState(false);
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const reduceMotion = useReducedMotion() ?? false;

  useEffect(() => {
    const query = window.matchMedia("(max-width: 600px)");
    const update = () => setIsSheet(query.matches);
    update();
    setMounted(true);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  const openSkill = useCallback((skill: Skill, trigger: HTMLButtonElement) => {
    const rect = trigger.getBoundingClientRect();
    triggerRef.current = trigger;
    setOrigin({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
    setSelected({ index: FLAT_SKILLS.findIndex((s) => s.label === skill.label), direction: 0 });
  }, []);

  const closeSkill = useCallback(() => {
    setSelected(null);
    triggerRef.current?.focus({ preventScroll: true });
  }, []);

  const navigate = useCallback((delta: number) => {
    setSelected((current) =>
      current
        ? { index: (current.index + delta + FLAT_SKILLS.length) % FLAT_SKILLS.length, direction: delta }
        : current,
    );
  }, []);

  const isOpen = selected !== null;

  // Keyboard shortcuts and scroll lock while the panel is open.
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeSkill();
      else if (event.key === "ArrowRight") navigate(1);
      else if (event.key === "ArrowLeft") navigate(-1);
    };
    const html = document.documentElement;
    const previous = { html: html.style.overflow, body: document.body.style.overflow };
    html.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      html.style.overflow = previous.html;
      document.body.style.overflow = previous.body;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, closeSkill, navigate]);

  const projectCount = new Set(FLAT_SKILLS.flatMap((s) => s.uses.map((u) => u.project))).size;

  return (
    <section className={styles.section} aria-labelledby="skills-heading" data-section="Skills">
      <SectionBackdrop blue="top-left" gold="bottom-right" />

      <div className={styles.inner}>
        <div className={styles.layout}>
          {/* Cards */}
          <div className={styles.grid}>
            {SKILL_GROUPS.map((group, index) => (
              <SkillCard
                key={group.id}
                group={group}
                index={index}
                reduceMotion={reduceMotion}
                dimmed={activeFilter !== "all" && activeFilter !== group.id}
                highlighted={activeFilter === group.id}
                selectedLabel={selected ? FLAT_SKILLS[selected.index].label : null}
                onSelect={openSkill}
              />
            ))}
          </div>

          {/* Heading, stats and filters */}
          {/* data-perch-obstacle: when this stacks above the grid, Livesey won't stand in front of the filters */}
          <aside className={styles.side} data-perch-obstacle {...reveal(0.1)}>
            <h2 id="skills-heading" className={styles.titleBlock} data-perch="Skills" data-perch-surface="text">
              <span className={styles.titleMain}><WaveText text="SKILLS" /></span>
              <span className={styles.titleSub}><WaveText text="TECHNOLOGIES" /></span>
            </h2>

            <div className={styles.stats}>
              <div className={styles.stat}>
                <span className={styles.statValue}>
                  <CountUp to={FLAT_SKILLS.length} />
                </span>
                <span className={styles.statLabel}>tools &amp; languages</span>
              </div>
              <div className={styles.statDivider} />
              <div className={styles.stat}>
                <span className={styles.statValue}>
                  <CountUp to={projectCount} />
                </span>
                <span className={styles.statLabel}>projects on GitHub</span>
              </div>
            </div>

            <div className={styles.filters} role="group" aria-label="Filter skills by discipline">
              {FILTERS.map((filter) => {
                const isActive = activeFilter === filter.id;
                return (
                  <button
                    key={filter.id}
                    type="button"
                    className={`${styles.filter} ${isActive ? styles.filterActive : ""}`}
                    aria-pressed={isActive}
                    onClick={() => setActiveFilter(filter.id)}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="skills-filter-pill"
                        className={styles.filterPill}
                        transition={{ type: "spring", stiffness: 420, damping: 34 }}
                      />
                    )}
                    <span className={styles.filterText}>{filter.label}</span>
                  </button>
                );
              })}
            </div>

            <p className={ui.hint}>
              <span className={ui.hintDot} aria-hidden="true" />
              Tap any tool to see where I&apos;ve used it
            </p>
          </aside>
        </div>

        {/* Logo marquee */}
        <div className={styles.marquee} {...reveal(0, "fade")}>
          <MarqueeRow items={MARQUEE_ROWS[0]} />
          <MarqueeRow items={MARQUEE_ROWS[1]} reverse />
        </div>
      </div>

      {mounted &&
        createPortal(
          <AnimatePresence>
            {selected && (
              <SkillDetail
                key="skill-detail"
                index={selected.index}
                direction={selected.direction}
                origin={origin}
                isSheet={isSheet}
                reduceMotion={reduceMotion}
                onClose={closeSkill}
                onNavigate={navigate}
              />
            )}
          </AnimatePresence>,
          document.body,
        )}
    </section>
  );
}
