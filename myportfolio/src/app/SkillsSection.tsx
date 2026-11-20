"use client";
import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";
import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type Variants,
} from "framer-motion";
import styles from "./SkillsSection.module.css";

const getImagePath = (path: string) => `${process.env.NEXT_PUBLIC_BASE_PATH || ""}${path}`;

type Skill = { icon: string; label: string };

type SkillGroup = {
  id: string;
  filterLabel: string;
  title: string;
  blurb: string;
  wide?: boolean;
  items: Skill[];
};

const SKILL_GROUPS: SkillGroup[] = [
  {
    id: "frontend",
    filterLabel: "Front-End",
    title: "Front-End Development",
    blurb: "Responsive, accessible interfaces for web and mobile.",
    items: [
      { icon: "/icons/html5.svg", label: "HTML5" },
      { icon: "/icons/css3.svg", label: "CSS3" },
      { icon: "/icons/javascript.svg", label: "JavaScript" },
      { icon: "/icons/typescript.svg", label: "TypeScript" },
      { icon: "/icons/angular.svg", label: "Angular" },
      { icon: "/icons/flutter.svg", label: "Flutter" },
    ],
  },
  {
    id: "backend",
    filterLabel: "Back-End",
    title: "Back-End Development",
    blurb: "APIs, services and the data layers behind them.",
    items: [
      { icon: "/icons/nodejs.svg", label: "Node.js" },
      { icon: "/icons/go.svg", label: "GoLang" },
      { icon: "/icons/php.svg", label: "PHP" },
      { icon: "/icons/postgresql.svg", label: "PostgreSQL" },
      { icon: "/icons/mongodb.svg", label: "MongoDB" },
      { icon: "/icons/mysql.svg", label: "MySQL" },
      { icon: "/icons/docker.svg", label: "Docker" },
    ],
  },
  {
    id: "devops",
    filterLabel: "DevOps",
    title: "DevOps",
    blurb: "Infrastructure as code, delivery pipelines and observability.",
    items: [
      { icon: "/icons/kubernetes-svgrepo-com.svg", label: "Kubernetes" },
      { icon: "/icons/terraform-svgrepo-com.svg", label: "Terraform" },
      { icon: "/icons/ansible-svgrepo-com.svg", label: "Ansible" },
      { icon: "/icons/Helm.svg", label: "Helm" },
      { icon: "/icons/Argo CD.svg", label: "Argo CD" },
      { icon: "/icons/prometheus-svgrepo-com.svg", label: "Prometheus" },
      { icon: "/icons/grafana-svgrepo-com.svg", label: "Grafana" },
    ],
  },
  {
    id: "languages",
    filterLabel: "Languages",
    title: "Programming",
    blurb: "From systems and embedded work to scripting.",
    items: [
      { icon: "/icons/python.svg", label: "Python" },
      { icon: "/icons/rust-svgrepo-com.svg", label: "Rust" },
      { icon: "/icons/cpp.svg", label: "C++" },
      { icon: "/icons/c.svg", label: "C" },
      { icon: "/icons/csharp.svg", label: "C#" },
      { icon: "/icons/java.svg", label: "Java" },
      { icon: "/icons/arduino.svg", label: "Arduino" },
    ],
  },
  {
    id: "design",
    filterLabel: "Design",
    title: "UI/UX Design",
    blurb: "Wireframes, prototypes and design systems before the first line of code.",
    wide: true,
    items: [{ icon: "/icons/figma.svg", label: "Figma" }],
  },
];

const ALL_SKILLS = SKILL_GROUPS.flatMap((group) => group.items);
const MARQUEE_ROWS = [
  ALL_SKILLS.filter((_, i) => i % 2 === 0),
  ALL_SKILLS.filter((_, i) => i % 2 === 1),
];

const FILTERS = [{ id: "all", label: "All" }, ...SKILL_GROUPS.map((g) => ({ id: g.id, label: g.filterLabel }))];

const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];

function CountUp({ to }: { to: number }) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const value = useMotionValue(0);
  const rounded = useTransform(value, (v) => Math.round(v).toString().padStart(2, "0"));

  useEffect(() => {
    if (!inView) return;
    const controls = animate(value, to, { duration: 1.4, ease: EASE_OUT });
    return () => controls.stop();
  }, [inView, to, value]);

  return <motion.span ref={ref}>{rounded}</motion.span>;
}

function SkillCard({
  group,
  index,
  dimmed,
  highlighted,
  reduceMotion,
}: {
  group: SkillGroup;
  index: number;
  dimmed: boolean;
  highlighted: boolean;
  reduceMotion: boolean;
}) {
  const cardRef = useRef<HTMLDivElement | null>(null);

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    card.style.setProperty("--mx", `${event.clientX - rect.left}px`);
    card.style.setProperty("--my", `${event.clientY - rect.top}px`);
  };

  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 48, filter: reduceMotion ? "blur(0px)" : "blur(10px)" },
    show: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: {
        duration: 0.8,
        ease: EASE_OUT,
        when: "beforeChildren",
        staggerChildren: 0.05,
      },
    },
  };

  const chipVariants: Variants = {
    hidden: { opacity: 0, y: 14, scale: 0.9 },
    show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 260, damping: 20 } },
  };

  return (
    <motion.div className={`${styles.cardSlot} ${group.wide ? styles.cardWide : ""}`} variants={cardVariants}>
      <motion.article
        ref={cardRef}
        className={`${styles.card} ${highlighted ? styles.cardHighlighted : ""}`}
        onPointerMove={handlePointerMove}
        animate={{
          opacity: dimmed ? 0.28 : 1,
          scale: dimmed ? 0.97 : 1,
          filter: dimmed ? "grayscale(1)" : "grayscale(0)",
        }}
        transition={{ duration: 0.45, ease: EASE_OUT }}
      >
        <div className={styles.cardHeader}>
          <span className={styles.cardIndex}>{String(index + 1).padStart(2, "0")}</span>
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
            {group.items.map((skill) => (
              <motion.li
                key={skill.label}
                className={styles.chip}
                variants={chipVariants}
                whileHover={reduceMotion ? undefined : { y: -4 }}
                transition={{ type: "spring", stiffness: 400, damping: 22 }}
              >
                <span className={styles.chipIcon}>
                  <Image src={getImagePath(skill.icon)} alt="" width={22} height={22} />
                </span>
                <span className={styles.chipLabel}>{skill.label}</span>
              </motion.li>
            ))}
          </ul>
        </div>
      </motion.article>
    </motion.div>
  );
}

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

export const skillsSectionClassName = styles.section;

export default function SkillsSection() {
  const [activeFilter, setActiveFilter] = useState("all");
  const reduceMotion = useReducedMotion() ?? false;

  const gridVariants: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
  };

  return (
    <section className={styles.section} aria-labelledby="skills-heading">
      <div className={styles.backdrop} aria-hidden="true">
        <div className={styles.gridPattern} />
        <div className={`${styles.orb} ${styles.orbBlue}`} />
        <div className={`${styles.orb} ${styles.orbGold}`} />
      </div>

      <div className={styles.inner}>
        <div className={styles.layout}>
          {/* Cards */}
          <motion.div
            className={styles.grid}
            variants={gridVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.15 }}
          >
            {SKILL_GROUPS.map((group, index) => (
              <SkillCard
                key={group.id}
                group={group}
                index={index}
                reduceMotion={reduceMotion}
                dimmed={activeFilter !== "all" && activeFilter !== group.id}
                highlighted={activeFilter === group.id}
              />
            ))}
          </motion.div>

          {/* Heading, stats and filters */}
          <motion.aside
            className={styles.side}
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.8, ease: EASE_OUT }}
          >
            <h2 id="skills-heading" className={styles.titleBlock}>
              <span className={styles.titleMain}>SKILLS</span>
              <span className={styles.titleSub}>TECHNOLOGIES</span>
            </h2>

            <div className={styles.stats}>
              <div className={styles.stat}>
                <span className={styles.statValue}>
                  <CountUp to={ALL_SKILLS.length} />
                </span>
                <span className={styles.statLabel}>tools &amp; languages</span>
              </div>
              <div className={styles.statDivider} />
              <div className={styles.stat}>
                <span className={styles.statValue}>
                  <CountUp to={SKILL_GROUPS.length} />
                </span>
                <span className={styles.statLabel}>disciplines</span>
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
          </motion.aside>
        </div>

        {/* Logo marquee */}
        <motion.div
          className={styles.marquee}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          <MarqueeRow items={MARQUEE_ROWS[0]} />
          <MarqueeRow items={MARQUEE_ROWS[1]} reverse />
        </motion.div>
      </div>
    </section>
  );
}
