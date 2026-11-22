"use client";
import Image from "next/image";
import styles from "./page.module.css";
import React, { useCallback, useEffect, useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import SkillsSection from "@/components/skills/SkillsSection";
import { Flag, SectionBackdrop, Starred, trackSpotlight, ui, WaveText } from "@/components/ui/ui";
import type { CountryCode } from "@/components/ui/ui";
import sx from "@/styles/sections.module.css";
import { SmoothScroll, scrollToSection, scrollToY } from "@/components/scroll/smoothScroll";
import ScrollRail from "@/components/scroll/ScrollRail";
import SectionNav from "@/components/scroll/SectionNav";
import LiveseyGuide from "@/components/livesey/LiveseyGuide";
import { FINE_POINTER_QUERY, useIsCompact, useMediaQuery } from "@/components/ui/useMediaQuery";
import { reveal, useScrollReveal } from "@/components/ui/useScrollReveal";

// Helper function to get the correct image path for GitHub Pages
const getImagePath = (path: string) => {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
  return `${basePath}${path}`;
};

const SOCIAL_LINKS = [
  { href: "https://t.me/Allimi3", platform: "telegram", icon: "/icons/telegram.svg", alt: "Telegram", handle: "@Allimi3" },
  { href: "https://github.com/3llimi", platform: "github", icon: "/icons/github.svg", alt: "GitHub", handle: "@3llimi" },
  { href: "https://www.linkedin.com/in/baha-alimi/", platform: "linkedin", icon: "/icons/linkedin.svg", alt: "LinkedIn", handle: "in/baha-alimi" },
];


const pad2 = (n: number) => n.toString().padStart(2, "0");

const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** README / contribution dialogs: phones skip the blur, which is costly to animate on a big panel. */
const DIALOG_PANEL_MOTION = {
  full: {
    initial: { opacity: 0, y: 24, scale: 0.92, filter: "blur(10px)" },
    animate: { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" },
    exit: { opacity: 0, y: 16, scale: 0.95, filter: "blur(6px)" },
  },
  lite: {
    initial: { opacity: 0, y: 24, scale: 0.96 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: 16, scale: 0.97 },
  },
};

/** Inline style that sets the hero entrance delay used by the CSS `.reveal` animation. */
const delay = (seconds: number, extra: React.CSSProperties = {}) =>
  ({ ...extra, ["--d" as string]: `${seconds}s` }) as React.CSSProperties;

function HeroSocialLinks() {
  return (
    <>
      {SOCIAL_LINKS.map((social) => (
        <motion.a
          key={social.platform}
          href={social.href}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.socialLink}
          data-platform={social.platform}
          aria-label={social.alt}
          whileHover={{ y: -3, scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          transition={{ type: "spring", stiffness: 400, damping: 18 }}
        >
          <div className={styles.socialIcon}>
            <Image src={getImagePath(social.icon)} alt={social.alt} fill />
          </div>
        </motion.a>
      ))}
    </>
  );
}
const repoPath = (url: string) => url.replace("https://github.com/", "");

type GitHubRepo = {
  id: number;
  name: string;
  description: string | null;
  html_url: string;
  language: string | null;
  topics?: string[];
  fork: boolean;
  archived: boolean;
  stargazers_count: number;
  updated_at: string;
};

type GitHubProjectCard = {
  id: number;
  title: string;
  description: string;
  cover: string;
  repoUrl: string;
  contributionRole?: string;
};

type SelectedRepoConfig = {
  repoName: string;
  cover: string;
  description?: string;
  contributionRole?: string;
};

type ReadmeApiResponse = {
  content?: string;
  path?: string;
  html_url?: string;
  download_url?: string;
};

type ReadmeUrlContext = {
  rawRepoRoot: string;
  rawDirBase: string;
  htmlRepoRoot: string;
  htmlDirBase: string;
};

const fallbackCovers = [
  "/images/portfolio-1.webp",
  "/images/portfolio-2.webp",
  "/images/portfolio-3.webp",
];

const fallbackGithubProjects: GitHubProjectCard[] = [
  {
    id: 1,
    title: "Portfolio Website",
    description:
      "Personal portfolio built with Next.js and Framer Motion with responsive sections, custom interactions, and GitHub Pages deployment.",
    cover: "/images/portfolio-1.webp",
    repoUrl: "https://github.com/3llimi/Portfolio",
  },
  {
    id: 2,
    title: "InnoSync",
    description:
      "Team project where I led frontend implementation and design, focusing on clean UI structure and scalable component-driven development.",
    cover: "/images/portfolio-2.webp",
    repoUrl: "https://github.com/3llimi",
  },
  {
    id: 3,
    title: "Hackathon Projects",
    description:
      "A collection of rapid prototypes and problem-solving builds from hackathons, with practical UI and backend integration work.",
    cover: "/images/portfolio-3.webp",
    repoUrl: "https://github.com/3llimi?tab=repositories",
  },
];

// Add exact GitHub repo names here to control which repos are shown.
// Leave empty to show top repositories automatically.
const selectedRepos: SelectedRepoConfig[] = [
  {
    repoName: "GPTitorSWP",
    cover: "/images/Gptitor.webp",
    contributionRole:
      `### GPTitor - AI Prompt Learning Platform

Software Project Course

GPTitor is an interactive learning platform designed to help users master prompt engineering through real-time feedback, guided tasks, and simulated conversations with LLMs.

#### My Contributions

**Lead Designer & Frontend Developer**
- Led end-to-end UI/UX design process using Figma
- Created wireframes, user flows, and a cohesive design system
- Designed a conversational learning interface tailored for education
- Built a reusable React component library with consistent patterns

**Frontend Developer (Web)**
- Developed responsive interfaces using React, TypeScript, and Vite
- Integrated real-time messaging and feedback system
- Built components for task selection, scoring, and user profiles
- Implemented modern, accessible UI with custom CSS

**UX/UI Designer & Researcher**
- Applied user-centered design principles for clarity and engagement
- Iterated designs based on peer and user feedback

#### Tech Stack

React, TypeScript, Vite, CSS, FastAPI (REST APIs), Jest, Figma, Git

#### Key Deliverables
- Reusable design system and component library
- Real-time chat interface with prompt feedback
- Interactive scoring and performance visualization
- Task management and user progress tracking
- Fully responsive and accessible web application

#### Impact

Delivered an intuitive EdTech platform while strengthening expertise in frontend engineering, UX design, and AI-driven learning experiences.`,
  },
  {
    repoName: "InnoSync-Capstone-Sum25",
    cover: "/images/Innosync.webp",
    contributionRole:
      `### Summer 2025 | Innopolis University

InnoSync is an AI-powered platform designed to connect students, researchers, and innovators through smart talent matching and collaborative project spaces.

#### My Contributions

**Team Lead & Scrum Master**
- Led a 7-member cross-functional team (Frontend, Backend, DevOps, ML, CustDev)
- Implemented Agile Scrum with weekly sprints using Asana and GitHub Issues
- Managed backlog, sprint planning, and progress reporting
- Reviewed pull requests, resolved conflicts, and enforced code standards

**Product Designer & UX Researcher**
- Conducted market research and competitor analysis
- Designed wireframes and high-fidelity prototypes in Figma
- Built a unified design system for both web and mobile platforms

**Frontend Developer (Web)**
- Developed responsive UI using Next.js, React, and TypeScript
- Translated Figma designs into production-ready components
- Supervised frontend architecture and coding practices

**Backend Developer (Mobile)**
- Designed and implemented RESTful APIs using Golang
- Structured PostgreSQL database and handled SQL implementation
- Created Swagger API documentation and developer guides

#### Tech Stack
- Web: Next.js, React, TypeScript, Spring Boot, PostgreSQL, Docker
- Mobile: Flutter, Golang
- Tools: GitHub Actions, Asana, Figma

#### Key Deliverables
- Fully deployed web platform
- Complete mobile application with documentation
- Unified cross-platform design system
- Agile workflow with consistent sprint delivery

#### Impact

Demonstrated strong technical leadership, full-stack development, and product thinking by driving a complex, multi-team project from concept to deployment.`,
  },
  {
    repoName: "Compilers-Construction-Course-F25",
    cover: "/images/compiler.webp",
    description:
      "A hands-on course repository covering core compiler design, from lexical analysis and parsing to semantic checks and code generation. The implementation was written in Rust.",
  },
  {
    repoName: "BookTrackerApp-SQRS-S26",
    cover: "/images/BookTrackerApp.webp",
    description:
      "A personal book collection tracker built with FastAPI, Streamlit, and the Open Library API. Part of the Software Quality, Reliability and Security (SQRS) course — Spring 2026 semester",
  },
  {
    repoName: "DevSecOps-Intro",
    cover: "/images/devsecops.webp",
    description:
      "An introductory repository that teaches how to integrate security into every stage of the DevOps lifecycle using practical workflows and tooling.",
  },
  {
    repoName: "ThreatHound",
    cover: "/images/Threathound.webp",
    description:
      "A threat-detection and analysis project focused on identifying, tracking, and responding to suspicious activity across systems and logs.",
    contributionRole:
      `### ThreatHound - Security Monitoring Platform

ThreatHound is a modular, containerized security platform designed for real-time threat detection, centralized log analysis, and automated vulnerability scanning. It combines Wazuh (SIEM), the ELK stack, and Trivy, all orchestrated with Docker for scalability and portability.

#### My Contributions

**Security Platform Integration**
- Deployed and configured Wazuh for real-time security monitoring
- Integrated Wazuh with the ELK stack for centralized logging
- Designed custom dashboards for actionable threat insights

**Containerization & Automation**
- Architected full Docker-based infrastructure
- Developed shell scripts to automate deployment and setup

**CI/CD Optimization**
- Improved CI/CD pipeline using GitHub Actions
- Diagnosed and resolved Docker image and build issues

**Testing & Cross-Platform Validation**
- Tested across Ubuntu, Kali Linux, Debian, and Windows
- Ensured stability across real and virtual environments

**Collaboration & Documentation**
- Coordinated debugging and development with team members
- Wrote technical documentation and user guides

#### Tech Stack

Wazuh (SIEM), ELK Stack (Elasticsearch, Logstash, Kibana), Trivy, Docker, Bash/Shell, GitHub Actions, Git

#### Key Deliverables
- Fully containerized security monitoring system
- Automated deployment scripts
- CI/CD pipeline integration
- Real-time analytics dashboards
- Cross-platform validated solution
- Comprehensive technical documentation

#### Impact

Built a scalable, production-like security platform while gaining hands-on experience in SIEM deployment, DevOps automation, containerization, and system security.`,
  },
  {
    repoName: "DevOps-Core-Course",
    cover: "/images/devops_loop.webp",
    description:
      "A foundational DevOps course repository focused on CI/CD, automation, infrastructure practices, and reliable software delivery.",
  },
  {
    repoName: "ACCPA",
    cover: "/images/ACCPA.webp",
    description:
      "The Great Type Checker of STELLA: a Rust-built ACCPA implementation spanning three stages, with core and advanced language features, type reconstruction, universal types, and precise ERROR_* diagnostics.",
  },
];

type LiveDemo = {
  repoName: string;
  title: string;
  tagline: string;
  url: string;
  cover: string;
  stack: string[];
  extraLinks?: { label: string; href: string }[];
  /** "frontend": only the UI is still hosted (its servers are gone) */
  status?: "live" | "frontend";
  note?: string;
  login?: { email: string; password: string };
};

// Deployed products, shown by the "Live demos" toggle in the GitHub section.
// URLs come from each repo's homepage / README.
const LIVE_DEMOS: LiveDemo[] = [
  {
    repoName: "InnoSync-Capstone-Sum25",
    title: "InnoSync",
    tagline: "AI-powered talent matching and collaborative project spaces for the Innopolis community.",
    url: "https://inno-sync-capstone-sum25.vercel.app",
    cover: "/images/Innosync.webp",
    stack: ["Next.js", "Spring Boot", "PostgreSQL", "ML"],
    extraLinks: [{ label: "API docs", href: "https://innosync-api-jju7.onrender.com/swagger-ui/index.html" }],
    login: { email: "demo@example.com", password: "InnoSyncDemo2026" },
  },
  {
    repoName: "GPTitorSWP",
    title: "GPTitor",
    tagline: "A sandbox for learning prompt engineering: write prompts, get graded feedback from LLMs.",
    url: "https://3llimi.github.io/GPTitorSWP/",
    cover: "/images/Gptitor.webp",
    stack: ["React", "TypeScript", "Vite", "FastAPI"],
    status: "frontend",
    note: "Front end only: the app's servers have been shut down, so you can explore the interface, but features that need the back end won't respond.",
  },
  {
    repoName: "BookTrackerApp-SQRS-S26",
    title: "Book Tracker",
    tagline: "A personal book collection tracker powered by the Open Library API.",
    url: "https://bookstracker.streamlit.app/",
    cover: "/images/BookTrackerApp.webp",
    stack: ["FastAPI", "Streamlit", "Neon Postgres"],
    extraLinks: [{ label: "API docs", href: "https://booktracker-api-3f3a.onrender.com/docs" }],
    login: { email: "test@test.com", password: "test123" },
  },
];

/** One credential row in a live demo card, with a copy-to-clipboard button. */
function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const resetRef = useRef<number | null>(null);

  useEffect(() => () => {
    if (resetRef.current !== null) window.clearTimeout(resetRef.current);
  }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      if (resetRef.current !== null) window.clearTimeout(resetRef.current);
      resetRef.current = window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard blocked (e.g. insecure context): the value stays visible and selectable
    }
  };

  return (
    <div className={sx.liveCred}>
      <dt className={sx.liveCredLabel}>{label}</dt>
      <dd className={sx.liveCredValue}>
        <code>{value}</code>
        <button
          type="button"
          className={`${sx.liveCopy} ${copied ? sx.liveCopyDone : ""}`}
          onClick={copy}
          aria-label={copied ? `${label} copied` : `Copy ${label.toLowerCase()}`}
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </dd>
    </div>
  );
}

const liveDemoByRepo = new Map(LIVE_DEMOS.map((demo) => [demo.repoName.toLowerCase(), demo]));

const urlHost = (url: string) => {
  try {
    const { host, pathname } = new URL(url);
    return `${host}${pathname.replace(/\/$/, "")}`;
  } catch {
    return url;
  }
};

const slugifyHeading = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const getNodeText = (node: React.ReactNode): string => {
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.map(getNodeText).join("");
  }

  if (React.isValidElement<{ children?: React.ReactNode }>(node)) {
    return getNodeText(node.props.children ?? "");
  }

  return "";
};

const extractOwnerAndRepo = (repoUrl: string) => {
  try {
    const parsed = new URL(repoUrl);
    const segments = parsed.pathname.split("/").filter(Boolean);
    if (segments.length < 2) {
      return null;
    }

    return {
      owner: segments[0],
      repo: segments[1].replace(/\.git$/i, ""),
    };
  } catch {
    return null;
  }
};

const decodeBase64Utf8 = (base64Value: string) => {
  const normalized = base64Value.replace(/\s/g, "");
  const binary = atob(normalized);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
};

const encodePathSegments = (path: string) =>
  path
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

const normalizeBase = (value: string) => (value.endsWith("/") ? value : `${value}/`);

const getDirectoryPath = (path: string) => {
  const segments = path.split("/").filter(Boolean);
  segments.pop();
  return segments.join("/");
};

const buildReadmeUrlContext = (
  repoInfo: { owner: string; repo: string },
  readmeData: ReadmeApiResponse
): ReadmeUrlContext => {
  const defaultRawRepoRoot = `https://raw.githubusercontent.com/${repoInfo.owner}/${repoInfo.repo}/HEAD/`;
  const defaultHtmlRepoRoot = `https://github.com/${repoInfo.owner}/${repoInfo.repo}/blob/HEAD/`;
  const readmePath = (readmeData.path || "README.md").replace(/^\/+/, "");
  const encodedReadmePath = encodePathSegments(readmePath);

  const rawRepoRoot =
    readmeData.download_url && readmeData.download_url.endsWith(encodedReadmePath)
      ? normalizeBase(readmeData.download_url.slice(0, -encodedReadmePath.length))
      : defaultRawRepoRoot;

  const htmlRepoRoot =
    readmeData.html_url && readmeData.html_url.endsWith(encodedReadmePath)
      ? normalizeBase(readmeData.html_url.slice(0, -encodedReadmePath.length))
      : defaultHtmlRepoRoot;

  const readmeDirectory = getDirectoryPath(readmePath);
  const encodedDirectory = readmeDirectory ? `${encodePathSegments(readmeDirectory)}/` : "";

  return {
    rawRepoRoot,
    rawDirBase: `${rawRepoRoot}${encodedDirectory}`,
    htmlRepoRoot,
    htmlDirBase: `${htmlRepoRoot}${encodedDirectory}`,
  };
};

const isAbsoluteUrl = (value: string) => /^[a-z][a-z\d+\-.]*:/i.test(value) || value.startsWith("//");

const isUnsafeUrl = (value: string) => /^\s*javascript:/i.test(value);

const resolveReadmeUrl = (
  value: string | undefined,
  kind: "asset" | "link",
  context: ReadmeUrlContext | null
) => {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed || isUnsafeUrl(trimmed) || trimmed.startsWith("#")) {
    return trimmed;
  }

  if (isAbsoluteUrl(trimmed) || !context) {
    return trimmed;
  }

  if (trimmed.startsWith("/")) {
    const fromRepoRoot = trimmed.replace(/^\/+/, "");
    const repoBase = kind === "asset" ? context.rawRepoRoot : context.htmlRepoRoot;

    try {
      return new URL(fromRepoRoot, repoBase).toString();
    } catch {
      return `${repoBase}${fromRepoRoot}`;
    }
  }

  const directoryBase = kind === "asset" ? context.rawDirBase : context.htmlDirBase;

  try {
    return new URL(trimmed, directoryBase).toString();
  } catch {
    return `${directoryBase}${trimmed}`;
  }
};

export default function Home() {
  const [githubProjects, setGithubProjects] = useState<GitHubProjectCard[]>(fallbackGithubProjects);
  const [isGitHubCarouselPaused, setIsGitHubCarouselPaused] = useState(false);
  const [showLiveDemos, setShowLiveDemos] = useState(false);
  const githubCarouselViewportRef = useRef<HTMLDivElement | null>(null);
  const githubCarouselTrackRef = useRef<HTMLDivElement | null>(null);
  const githubMarqueeOffsetRef = useRef(0);
  const githubMarqueeLoopWidthRef = useRef(0);
  const githubMarqueeRafRef = useRef<number | null>(null);
  const githubMarqueeLastTimestampRef = useRef<number | null>(null);
  const githubMarqueeVelocityRef = useRef(0);
  const isGitHubCarouselPausedRef = useRef(false);
  const githubTouchXRef = useRef<number | null>(null);
  const githubTouchYRef = useRef<number | null>(null);
  const [readmeTitle, setReadmeTitle] = useState<string | null>(null);
  const [readmeRepoUrl, setReadmeRepoUrl] = useState<string | null>(null);
  const [readmeContent, setReadmeContent] = useState("");
  const [readmeUrlContext, setReadmeUrlContext] = useState<ReadmeUrlContext | null>(null);
  const [readmeError, setReadmeError] = useState<string | null>(null);
  const [isReadmeLoading, setIsReadmeLoading] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  // Phones/tablets: native swipe lists instead of auto-scrolling marquees, no Livesey/README/cursor
  const isCompact = useIsCompact();
  const dialogPanelMotion = isCompact ? DIALOG_PANEL_MOTION.lite : DIALOG_PANEL_MOTION.full;
  useScrollReveal();
  const [activeContribution, setActiveContribution] = useState<{
    title: string;
    content: string;
  } | null>(null);
  // The marquee renders its cards twice to loop seamlessly; the swipe list needs them once
  const marqueeGithubProjects = useMemo(
    () => (githubProjects.length > 0 && !isCompact ? [...githubProjects, ...githubProjects] : githubProjects),
    [githubProjects, isCompact]
  );

  useEffect(() => {
    isGitHubCarouselPausedRef.current = isGitHubCarouselPaused;
  }, [isGitHubCarouselPaused]);

  const paData: { title: string; rightLabel: string; country: CountryCode; subtitle: string; scholarship: boolean }[] = [
    {
      title: "IoT4Tunisia Bootcamp",
      rightLabel: "MentorNations · 2020–2021",
      country: "TN",
      subtitle: "DESIGNER & WEB DEVELOPER",
      scholarship: false,
    },
    {
      title: "HackUrWaste Hackathon",
      rightLabel: "MentorNations · 2022",
      country: "TN",
      subtitle: "MENTOR",
      scholarship: false,
    },
    {
      title: "Tunisian National Olympiad in Informatics",
      rightLabel: "ITA · 2022",
      country: "TN",
      subtitle: "Contestant",
      scholarship: false,
    },
    {
      title: "Upside Education Hackathon",
      rightLabel: "GOMYCODE · 2022",
      country: "TN",
      subtitle: "DESIGNER & WEB DEVELOPER",
      scholarship: false,
    },
    {
      title: "Winner of the Full Russian Government Scholarship",
      rightLabel: "2023–2027",
      country: "RU",
      subtitle: "CURRENTLY A COMPUTER SCIENCE STUDENT IN INNOPOLIS UNIVERSITY",
      scholarship: true,
    },
    {
      title: "Advanced Engineering School",
      rightLabel: "Jun–Dec 2024",
      country: "RU",
      subtitle: "Junior GUI Developer",
      scholarship: false,
    },
    {
      title: "Kazan TechArena Hackathon",
      rightLabel: "Huawei · 2025",
      country: "RU",
      subtitle: "Contestant",
      scholarship: false,
    },
    {
      title: "InnoSync",
      rightLabel: "Innopolis University · 2025",
      country: "RU",
      subtitle: "Team Lead - Frontend Dev - Designer",
      scholarship: false,
    },
    {
      title: "Middle East Technical University",
      rightLabel: "Fall 2026",
      country: "TR",
      subtitle: "Exchange Student - Computer Engineering Faculty",
      scholarship: false,
    },
  ];
  const marqueePaData = paData.length > 0 ? [...paData, ...paData] : [];

  // Custom cursor refs for high-frequency pointer updates without re-rendering
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const cursorPositionRef = useRef({ x: 0, y: 0 });
  const cursorRafRef = useRef<number | null>(null);
  // Only with a real mouse/trackpad: on touch screens the dot would just sit in a corner
  const showCursor = useMediaQuery(FINE_POINTER_QUERY);

  useEffect(() => {
    const controller = new AbortController();
    const normalizedSelectedRepoNames = selectedRepos
      .map((config) => config.repoName.trim())
      .filter((repoName) => repoName.length > 0);
    const selectedRepoNameSet = new Set(
      normalizedSelectedRepoNames.map((repoName) => repoName.toLowerCase())
    );
    const selectedRepoDetails = new Map(
      selectedRepos.map((config) => [
        config.repoName.trim().toLowerCase(),
        {
          cover: config.cover,
          description: config.description?.trim(),
          contributionRole: config.contributionRole?.trim(),
        },
      ])
    );

    const loadGitHubProjects = async () => {
      try {
        const response = await fetch("https://api.github.com/users/3llimi/repos?sort=updated&per_page=100", {
          headers: {
            Accept: "application/vnd.github+json",
          },
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`GitHub API request failed: ${response.status}`);
        }

        const repos = (await response.json()) as GitHubRepo[];

        let filteredRepos = repos
          .filter((repo) => !repo.archived && (selectedRepoNameSet.size > 0 || !repo.fork))
          .sort((a, b) => {
            if (b.stargazers_count !== a.stargazers_count) {
              return b.stargazers_count - a.stargazers_count;
            }
            return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
          });

        if (selectedRepoNameSet.size > 0) {
          filteredRepos = filteredRepos
            .filter((repo) => selectedRepoNameSet.has(repo.name.toLowerCase()))
            .sort(
              (a, b) =>
                normalizedSelectedRepoNames.findIndex(
                  (repoName) => repoName.toLowerCase() === a.name.toLowerCase()
                ) -
                normalizedSelectedRepoNames.findIndex(
                  (repoName) => repoName.toLowerCase() === b.name.toLowerCase()
                )
            );
        } else {
          filteredRepos = filteredRepos.slice(0, 6);
        }

        const mappedProjects = filteredRepos.map((repo, index) => {
          const selectedRepoDetail = selectedRepoDetails.get(repo.name.toLowerCase());
          return {
            id: repo.id,
            title: repo.name,
            description:
              selectedRepoDetail?.description ||
              repo.description?.trim() ||
              "Repository project with implementation details available in the source code.",
            cover:
              selectedRepoDetail?.cover ??
              fallbackCovers[index % fallbackCovers.length],
            repoUrl: repo.html_url,
            contributionRole: selectedRepoDetail?.contributionRole,
          } satisfies GitHubProjectCard;
        });

        if (mappedProjects.length > 0 || selectedRepoNameSet.size > 0) {
          setGithubProjects(mappedProjects);
        }
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setGithubProjects(fallbackGithubProjects);
        }
      }
    };

    loadGitHubProjects();

    return () => {
      controller.abort();
    };
  }, []);

  const applyGitHubMarqueeTransform = (offset: number) => {
    const track = githubCarouselTrackRef.current;
    if (!track) {
      return;
    }

    track.style.transform = `translate3d(-${offset}px, 0, 0)`;
  };

  const setGitHubMarqueeOffset = useCallback((rawOffset: number) => {
    const loopWidth = githubMarqueeLoopWidthRef.current;
    if (loopWidth <= 0) {
      return;
    }

    const normalizedOffset = ((rawOffset % loopWidth) + loopWidth) % loopWidth;
    githubMarqueeOffsetRef.current = normalizedOffset;
    applyGitHubMarqueeTransform(normalizedOffset);
  }, []);

  const handleGitHubTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    setIsGitHubCarouselPaused(true);
    githubTouchXRef.current = event.touches[0]?.clientX ?? null;
    githubTouchYRef.current = event.touches[0]?.clientY ?? null;
  };

  const handleGitHubTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    if (githubMarqueeLoopWidthRef.current <= 0) {
      return;
    }

    const currentX = event.touches[0]?.clientX;
    const currentY = event.touches[0]?.clientY;
    if (
      currentX === undefined ||
      currentY === undefined ||
      githubTouchXRef.current === null ||
      githubTouchYRef.current === null
    ) {
      return;
    }

    const deltaX = githubTouchXRef.current - currentX;
    const deltaY = githubTouchYRef.current - currentY;
    githubTouchXRef.current = currentX;
    githubTouchYRef.current = currentY;

    if (Math.abs(deltaX) >= Math.abs(deltaY)) {
      event.preventDefault();
      setGitHubMarqueeOffset(githubMarqueeOffsetRef.current + deltaX);
    }
  };

  const handleGitHubTouchEnd = () => {
    githubTouchXRef.current = null;
    githubTouchYRef.current = null;
    setIsGitHubCarouselPaused(false);
  };

  useEffect(() => {
    const track = githubCarouselTrackRef.current;
    // The marquee unmounts while the live-demo grid shows, so re-measure when it comes back
    if (!track || githubProjects.length === 0 || isCompact || showLiveDemos) {
      githubMarqueeOffsetRef.current = 0;
      githubMarqueeLoopWidthRef.current = 0;
      if (track) track.style.transform = "";
      return;
    }

    const updateLoopWidth = () => {
      const loopWidth = track.scrollWidth / 2;
      githubMarqueeLoopWidthRef.current = Number.isFinite(loopWidth) ? loopWidth : 0;

      if (githubMarqueeLoopWidthRef.current <= 0) {
        githubMarqueeOffsetRef.current = 0;
      } else if (githubMarqueeOffsetRef.current >= githubMarqueeLoopWidthRef.current) {
        githubMarqueeOffsetRef.current %= githubMarqueeLoopWidthRef.current;
      }

      applyGitHubMarqueeTransform(githubMarqueeOffsetRef.current);
    };

    updateLoopWidth();

    const resizeObserver = new ResizeObserver(updateLoopWidth);
    resizeObserver.observe(track);

    const viewport = githubCarouselViewportRef.current;
    if (viewport) {
      resizeObserver.observe(viewport);
    }

    window.addEventListener("resize", updateLoopWidth);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateLoopWidth);
    };
  }, [githubProjects.length, marqueeGithubProjects.length, isCompact, showLiveDemos]);

  useEffect(() => {
    if (!hasMounted || isCompact || showLiveDemos) {
      return;
    }

    const viewport = githubCarouselViewportRef.current;
    if (!viewport) {
      return;
    }

    const handleWheel = (event: WheelEvent) => {
      if (githubMarqueeLoopWidthRef.current <= 0) {
        return;
      }

      const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      if (delta === 0) {
        return;
      }

      event.preventDefault();
      setIsGitHubCarouselPaused(true);
      setGitHubMarqueeOffset(githubMarqueeOffsetRef.current + delta);
    };

    viewport.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      viewport.removeEventListener("wheel", handleWheel);
    };
  }, [hasMounted, isCompact, showLiveDemos, setGitHubMarqueeOffset]);

  useEffect(() => {
    if (githubProjects.length === 0 || isCompact || showLiveDemos) {
      return;
    }

    const speedPxPerSecond = 46;

    const step = (timestamp: number) => {
      if (githubMarqueeLastTimestampRef.current === null) {
        githubMarqueeLastTimestampRef.current = timestamp;
      }

      const elapsedSeconds = Math.min(
        (timestamp - githubMarqueeLastTimestampRef.current) / 1000,
        0.05
      );
      githubMarqueeLastTimestampRef.current = timestamp;

      const loopWidth = githubMarqueeLoopWidthRef.current;
      if (loopWidth > 0) {
        const targetVelocity = isGitHubCarouselPausedRef.current ? 0 : speedPxPerSecond;
        const smoothing = 1 - Math.exp(-7 * elapsedSeconds);
        githubMarqueeVelocityRef.current +=
          (targetVelocity - githubMarqueeVelocityRef.current) * smoothing;

        const nextOffset =
          githubMarqueeOffsetRef.current + githubMarqueeVelocityRef.current * elapsedSeconds;
        setGitHubMarqueeOffset(nextOffset);
      }

      githubMarqueeRafRef.current = requestAnimationFrame(step);
    };

    githubMarqueeRafRef.current = requestAnimationFrame(step);

    return () => {
      if (githubMarqueeRafRef.current !== null) {
        cancelAnimationFrame(githubMarqueeRafRef.current);
        githubMarqueeRafRef.current = null;
      }
      githubMarqueeLastTimestampRef.current = null;
      githubMarqueeVelocityRef.current = 0;
    };
  }, [githubProjects.length, isCompact, showLiveDemos, setGitHubMarqueeOffset]);

  const handleReadmeClick = async (project: GitHubProjectCard) => {
    const repoInfo = extractOwnerAndRepo(project.repoUrl);

    setReadmeTitle(project.title);
    setReadmeRepoUrl(project.repoUrl);
    setReadmeContent("");
    setReadmeUrlContext(null);
    setReadmeError(null);

    if (!repoInfo) {
      setReadmeError("Could not parse repository path from this project link.");
      return;
    }

    setIsReadmeLoading(true);

    try {
      const response = await fetch(`https://api.github.com/repos/${repoInfo.owner}/${repoInfo.repo}/readme`, {
        headers: {
          Accept: "application/vnd.github+json",
        },
      });

      if (!response.ok) {
        throw new Error(`README request failed with ${response.status}`);
      }

      const readmeData = (await response.json()) as ReadmeApiResponse;

      if (!readmeData.content) {
        throw new Error("README content is missing from API response");
      }

      const content = decodeBase64Utf8(readmeData.content);
      setReadmeUrlContext(buildReadmeUrlContext(repoInfo, readmeData));
      setReadmeContent(content || "README is empty for this repository.");
    } catch {
      setReadmeError("Could not load README for this repository right now.");
    } finally {
      setIsReadmeLoading(false);
    }
  };

  const closeReadmeOverlay = () => {
    setReadmeTitle(null);
    setReadmeRepoUrl(null);
    setReadmeContent("");
    setReadmeUrlContext(null);
    setReadmeError(null);
    setIsReadmeLoading(false);
  };

  const handleContributionClick = (project: GitHubProjectCard) => {
    if (!project.contributionRole) {
      return;
    }

    setActiveContribution({
      title: project.title,
      content: project.contributionRole,
    });
  };

  const closeContributionOverlay = () => {
    setActiveContribution(null);
  };

  useEffect(() => {
    if (!readmeTitle && !activeContribution) {
      return;
    }

    const html = document.documentElement;
    const previousOverflow = document.body.style.overflow;
    const previousHtmlOverflow = html.style.overflow;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (readmeTitle) {
          closeReadmeOverlay();
        }
        if (activeContribution) {
          closeContributionOverlay();
        }
      }
    };

    // Lock <html> too: it is the page's scroller (and pauses Lenis while the dialog is open)
    document.body.style.overflow = "hidden";
    html.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      html.style.overflow = previousHtmlOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [readmeTitle, activeContribution]);

  const readmeHeadingCounters = new Map<string, number>();
  const getReadmeHeadingId = (children: React.ReactNode) => {
    const text = getNodeText(children).trim();
    const base = slugifyHeading(text);
    const seen = readmeHeadingCounters.get(base) ?? 0;
    readmeHeadingCounters.set(base, seen + 1);
    return seen === 0 ? base : `${base}-${seen}`;
  };

  const readmeHeadingComponents: Components = {
    h1: ({ children, ...props }) => {
      const id = getReadmeHeadingId(children);
      return (
        <h1 id={id} {...props}>
          {children}
        </h1>
      );
    },
    h2: ({ children, ...props }) => {
      const id = getReadmeHeadingId(children);
      return (
        <h2 id={id} {...props}>
          {children}
        </h2>
      );
    },
    h3: ({ children, ...props }) => {
      const id = getReadmeHeadingId(children);
      return (
        <h3 id={id} {...props}>
          {children}
        </h3>
      );
    },
    a: ({ href, children, ...props }) => {
      const resolvedHref = resolveReadmeUrl(href, "link", readmeUrlContext);
      const isExternal = Boolean(resolvedHref && /^(https?:)?\/\//i.test(resolvedHref));

      return (
        <a
          href={resolvedHref}
          target={isExternal ? "_blank" : undefined}
          rel={isExternal ? "noopener noreferrer" : undefined}
          {...props}
        >
          {children}
        </a>
      );
    },
    img: ({ src, alt, ...props }) => {
      const srcValue = typeof src === "string" ? src : undefined;
      const resolvedSrc = resolveReadmeUrl(srcValue, "asset", readmeUrlContext);

      if (!resolvedSrc || isUnsafeUrl(resolvedSrc)) {
        return null;
      }

      // External README images come from arbitrary repos and must stay dynamic.
      // eslint-disable-next-line @next/next/no-img-element
      return <img src={resolvedSrc} alt={alt || ""} loading="lazy" {...props} />;
    },
  };

  useEffect(() => {
    const supportsRestoration = "scrollRestoration" in window.history;
    const previousRestoration = supportsRestoration ? window.history.scrollRestoration : null;

    if (supportsRestoration) {
      window.history.scrollRestoration = "manual";
    }

    window.scrollTo({ top: 0, left: 0, behavior: "auto" });

    return () => {
      if (supportsRestoration && previousRestoration) {
        window.history.scrollRestoration = previousRestoration;
      }
    };
  }, []);

  useEffect(() => {
    if (!showCursor) return;
    const cursorEl = cursorRef.current;
    if (!cursorEl) return;

    const renderCursor = () => {
      cursorEl.style.left = `${cursorPositionRef.current.x}px`;
      cursorEl.style.top = `${cursorPositionRef.current.y}px`;
      cursorRafRef.current = null;
    };

    const move = (e: MouseEvent) => {
      cursorPositionRef.current.x = e.clientX;
      cursorPositionRef.current.y = e.clientY;
      if (cursorRafRef.current === null) {
        cursorRafRef.current = requestAnimationFrame(renderCursor);
      }
    };

    window.addEventListener("mousemove", move, { passive: true });
    return () => {
      window.removeEventListener("mousemove", move);
      if (cursorRafRef.current !== null) {
        cancelAnimationFrame(cursorRafRef.current);
        cursorRafRef.current = null;
      }
    };
  }, [showCursor]);

  // Refs for continuous marquee in Projects section
  const projectsCarouselViewportRef = useRef<HTMLDivElement | null>(null);
  const projectsCarouselTrackRef = useRef<HTMLDivElement | null>(null);
  const projectsMarqueeOffsetRef = useRef(0);
  const projectsMarqueeLoopHeightRef = useRef(0);
  const projectsMarqueeRafRef = useRef<number | null>(null);
  const projectsMarqueeLastTimestampRef = useRef<number | null>(null);
  const projectsMarqueeVelocityRef = useRef(0);
  const isProjectsCarouselPausedRef = useRef(false);
  const projectsTouchYRef = useRef<number | null>(null);
  const [isCarouselHovered, setIsCarouselHovered] = useState(false);

  useEffect(() => {
    isProjectsCarouselPausedRef.current = isCarouselHovered;
  }, [isCarouselHovered]);

  const applyProjectsMarqueeTransform = useCallback((offset: number) => {
    const track = projectsCarouselTrackRef.current;
    if (!track) {
      return;
    }

    track.style.transform = `translate3d(0, -${offset}px, 0)`;
  }, []);

  const setProjectsMarqueeOffset = useCallback((rawOffset: number) => {
    const loopHeight = projectsMarqueeLoopHeightRef.current;
    if (loopHeight <= 0) {
      return;
    }

    const normalizedOffset = ((rawOffset % loopHeight) + loopHeight) % loopHeight;
    projectsMarqueeOffsetRef.current = normalizedOffset;
    applyProjectsMarqueeTransform(normalizedOffset);
  }, [applyProjectsMarqueeTransform]);

  const handleProjectsTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    setIsCarouselHovered(true);
    projectsTouchYRef.current = event.touches[0]?.clientY ?? null;
  };

  const handleProjectsTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    if (projectsMarqueeLoopHeightRef.current <= 0) {
      return;
    }

    const currentY = event.touches[0]?.clientY;
    if (currentY === undefined || projectsTouchYRef.current === null) {
      return;
    }

    event.preventDefault();
    const deltaY = projectsTouchYRef.current - currentY;
    projectsTouchYRef.current = currentY;
    setProjectsMarqueeOffset(projectsMarqueeOffsetRef.current + deltaY);
  };

  const handleProjectsTouchEnd = () => {
    projectsTouchYRef.current = null;
    setIsCarouselHovered(false);
  };

  useEffect(() => {
    if (!hasMounted || isCompact) {
      return;
    }

    const track = projectsCarouselTrackRef.current;
    if (!track || paData.length === 0) {
      projectsMarqueeOffsetRef.current = 0;
      projectsMarqueeLoopHeightRef.current = 0;
      return;
    }

    const updateLoopHeight = () => {
      const loopHeight = track.scrollHeight / 2;
      projectsMarqueeLoopHeightRef.current = Number.isFinite(loopHeight) ? loopHeight : 0;

      if (projectsMarqueeLoopHeightRef.current <= 0) {
        projectsMarqueeOffsetRef.current = 0;
      } else if (projectsMarqueeOffsetRef.current >= projectsMarqueeLoopHeightRef.current) {
        projectsMarqueeOffsetRef.current %= projectsMarqueeLoopHeightRef.current;
      }

      applyProjectsMarqueeTransform(projectsMarqueeOffsetRef.current);
    };

    updateLoopHeight();

    const resizeObserver = new ResizeObserver(updateLoopHeight);
    resizeObserver.observe(track);

    const viewport = projectsCarouselViewportRef.current;
    if (viewport) {
      resizeObserver.observe(viewport);
    }

    window.addEventListener("resize", updateLoopHeight);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateLoopHeight);
    };
  }, [applyProjectsMarqueeTransform, hasMounted, isCompact, marqueePaData.length, paData.length]);

  useEffect(() => {
    if (!hasMounted || isCompact) {
      return;
    }

    const viewport = projectsCarouselViewportRef.current;
    if (!viewport) {
      return;
    }

    const handleWheel = (event: WheelEvent) => {
      if (projectsMarqueeLoopHeightRef.current <= 0) {
        return;
      }

      event.preventDefault();
      setIsCarouselHovered(true);
      setProjectsMarqueeOffset(projectsMarqueeOffsetRef.current + event.deltaY);
    };

    viewport.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      viewport.removeEventListener("wheel", handleWheel);
    };
  }, [hasMounted, isCompact, setProjectsMarqueeOffset]);

  useEffect(() => {
    if (!hasMounted || isCompact || paData.length === 0) {
      return;
    }

    const speedPxPerSecond = 120;

    const step = (timestamp: number) => {
      if (projectsMarqueeLastTimestampRef.current === null) {
        projectsMarqueeLastTimestampRef.current = timestamp;
      }

      const elapsedSeconds = Math.min(
        (timestamp - projectsMarqueeLastTimestampRef.current) / 1000,
        0.05
      );
      projectsMarqueeLastTimestampRef.current = timestamp;

      const loopHeight = projectsMarqueeLoopHeightRef.current;
      if (loopHeight > 0) {
        const targetVelocity = isProjectsCarouselPausedRef.current ? 0 : speedPxPerSecond;
        const smoothing = 1 - Math.exp(-7 * elapsedSeconds);
        projectsMarqueeVelocityRef.current +=
          (targetVelocity - projectsMarqueeVelocityRef.current) * smoothing;

        const nextOffset =
          projectsMarqueeOffsetRef.current + projectsMarqueeVelocityRef.current * elapsedSeconds;
        setProjectsMarqueeOffset(nextOffset);
      }

      projectsMarqueeRafRef.current = requestAnimationFrame(step);
    };

    projectsMarqueeRafRef.current = requestAnimationFrame(step);

    return () => {
      if (projectsMarqueeRafRef.current !== null) {
        cancelAnimationFrame(projectsMarqueeRafRef.current);
        projectsMarqueeRafRef.current = null;
      }
      projectsMarqueeLastTimestampRef.current = null;
      projectsMarqueeVelocityRef.current = 0;
    };
  }, [hasMounted, isCompact, paData.length, setProjectsMarqueeOffset]);

  // Hydration fix: only render browser-dependent UI after mount
  useEffect(() => { setHasMounted(true); }, []);

  return (
    <>
      {/* Custom Cursor */}
      {showCursor && (
        <div
          ref={cursorRef}
          className={styles.customCursorInvert}
        />
      )}
      <div className={`${styles.portfolio} ${showCursor ? styles.cursorHidden : ""}`}>
        {/* Hero Section */}
        <section className={styles.hero} data-section="Home">
          {/* Background Image */}
          <div className={`${styles.heroBackground} ${sx.heroBg}`}>
            {/* The original photo is 4092px wide (~45 MB once decoded): phones get a 2000px copy and
                desktops a 2560px one, so the first paint and the entrance animation don't stall. */}
            <picture>
              <source
                media="(max-width: 900px), (orientation: portrait) and (max-width: 1100px)"
                srcSet={getImagePath("/images/hero-bg-mobile.webp")}
                type="image/webp"
              />
              <source srcSet={getImagePath("/images/hero-bg.webp")} type="image/webp" />
              <img
                src={getImagePath("/images/hero-bg.jpg")}
                alt=""
                className={styles.heroImage}
                fetchPriority="high"
                decoding="async"
              />
            </picture>
            <div className={styles.heroOverlay}></div>
          </div>
          {/* Content: both layouts are rendered and CSS shows one, so server and client markup match */}
          <div className={styles.heroContent}>
            {/* Phones & portrait tablets: picture first, then writing, then social links */}
            <div className={sx.heroMobile}>
              <div
                className={`${styles.heroImageContainer} ${sx.reveal} ${sx.revealImage}`}
                style={delay(0.15)}
              >
                <Image
                  src={getImagePath("/images/profile-photo.png")}
                  alt="Ahmed Baha Eddine Alimi"
                  width={400}
                  height={400}
                  className={styles.profileImage}
                  priority
                />
              </div>
              <h1 className={styles.heroName}>
                <span className={`${styles.lastName} ${sx.reveal}`} style={delay(0.25)}>
                  <span className={styles.rotatingStar}>*</span>
                  <WaveText text="Alimi" />
                </span>
                <span className={`${styles.firstName} ${sx.reveal}`} style={delay(0.33)}>
                  <WaveText text="Ahmed Baha Eddine" />
                </span>
              </h1>
              <p className={`${styles.heroTitle} ${sx.reveal}`} style={delay(0.42)}>
                <span className={styles.heroAccent}>Software Engineer</span>
              </p>
              <p className={`${styles.heroSubtitle} ${sx.reveal}`} style={delay(0.48)}>
                CS <span className={styles.heroTitleSep}>@</span> Innopolis University
              </p>
              <div className={`${styles.socialLinksContainer} ${sx.reveal}`} style={delay(0.52)}>
                <div className={styles.socialLinks}>
                  <HeroSocialLinks />
                </div>
              </div>
              <button
                type="button"
                className={`${styles.scrollCue} ${sx.reveal}`}
                style={delay(0.9)}
                onClick={() => {
                  const about = document.querySelector<HTMLElement>('[data-section="About"]');
                  if (about) scrollToSection(about);
                }}
              >
                <span>Scroll</span>
                <span className={styles.scrollCueLine} aria-hidden="true" />
              </button>
            </div>

            {/* Desktop */}
            <div className={sx.heroDesktop}>
              <h1 className={styles.heroName}>
                <span className={`${styles.lastName} ${sx.reveal}`} style={delay(0.2)} data-perch="Home" data-perch-surface="text" data-perch-x="0.25-0.5">
                  <span className={styles.rotatingStar}>*</span>
                  <WaveText text="Alimi" />
                </span>
                <span className={`${styles.firstName} ${sx.reveal}`} style={delay(0.3)}>
                  <WaveText text="Ahmed Baha Eddine" />
                </span>
              </h1>
              <p className={`${styles.heroTitle} ${sx.reveal}`} style={delay(0.45)}>
                <span className={`${ui.sweep} ${styles.heroAccent}`}>Software Engineer</span>
              </p>
              <p className={`${styles.heroSubtitle} ${sx.reveal}`} style={delay(0.52)}>
                <span className={ui.sweep}>CS @ Innopolis University</span>
              </p>
              <div className={`${styles.heroImageContainer} ${sx.reveal} ${sx.revealImage}`} style={delay(0.35)} data-perch="Home" data-perch-x="0.5">
                <Image
                  src={getImagePath("/images/profile-photo.png")}
                  alt="Ahmed Baha Eddine Alimi"
                  width={500}
                  height={500}
                  className={styles.profileImage}
                  priority
                />
              </div>
              <div className={`${styles.socialLinksContainer} ${sx.reveal}`} style={delay(0.65)} data-perch="Home" data-perch-x="0.3-0.7">
                <div className={styles.socialLinks}>
                  <HeroSocialLinks />
                </div>
              </div>
              <div className={`${styles.heroCaption} ${sx.reveal}`} style={delay(0.85)}>
                Shot in Innopolis University&apos;s Robotics Lab: By Me
              </div>
            </div>
          </div>
        </section>

        {/* About Me Section */}
        <section
          className={`${styles.aboutSection} ${sx.shell}`}
          data-section="About"
        >
          <SectionBackdrop blue="bottom-left" gold="top-right" />
          <div className={styles.aboutContainer}>
            {/* Left Side - Title */}
            <div className={styles.aboutTitle} {...reveal(0.05)}>
              <h2 className={sx.mobileTitle} data-perch="About" data-perch-surface="text"><WaveText text="ABOUT ME" /></h2>
            </div>

            {/* Right Side - Content */}
            <div className={styles.aboutContent} {...reveal(0.15)}>
              {/* Top Quote Mark */}
              <div className={styles.quoteTop} data-perch="About" data-perch-surface="text" data-perch-x="0.5">&ldquo;</div>

              {/* Main Content */}
              <div className={styles.aboutText}>
                <h3 className={styles.aboutIntro}>
                  I&apos;m <strong>Ahmed Baha Eddine Alimi</strong>, a <em>software engineer</em>.
                </h3>

                <h4 className={styles.aboutLocation}>
                  Computer Science student at Innopolis University, based in{" "}
                  <span className={styles.russiaText} data-text="Russia">Russia</span>
                </h4>

                <div className={styles.aboutDescription}>
                  <p>
                    I build reliable, well-designed software across the full development
                    lifecycle, from system design and implementation to deployment and
                    maintenance. I care about clean architecture, thoughtful engineering
                    practices, and products that are a pleasure to use.
                  </p>

                  <p>
                    I&apos;ve led and collaborated in cross-functional teams, delivering
                    projects from concept to production. I&apos;m always looking to solve
                    challenging problems and grow as an engineer.
                  </p>
                </div>
              </div>
              {/* Bottom Quote Mark */}
              <div className={styles.quoteBottom}>&rdquo;</div>
            </div>
          </div>
        </section>

        {/* Skills & Technologies Section */}
        <SkillsSection />

        {/* Projects & Achievements Section - Screenshot Match */}
        <section
          className={`${styles.projectsAchievementsSection} ${sx.shell}`}
          data-section="Projects"
        >
          <SectionBackdrop blue="top-left" gold="bottom-right" />
          <div className={styles.paColumns2}>
            {/* Left: Titles */}
            <div className={styles.paLeft2} {...reveal(0.05)}>
              <div className={`${styles.paProjects} ${sx.mobileTitle}`} data-perch="Projects" data-perch-surface="text"><WaveText text="PROJECTS" /></div>
              <div className={styles.paAmp}>&</div>
              <div className={`${styles.paAchievements} ${sx.mobileTitle}`}><WaveText text="ACHIEVEMENTS" /></div>
              <div className={sx.paMeta}>
                <p className={`${ui.hint} ${sx.hoverOnly}`}>
                  <span className={ui.hintDot} aria-hidden="true" />
                  Hover to pause, scroll to browse
                </p>
              </div>
            </div>
            {/* Center: Project Blocks Vertical Scrollable */}
            <div className={styles.paCenter2} {...reveal(0.15)}>
              {/* Touch screens: a plain list that scrolls with the page (the marquee would trap the swipe) */}
              {hasMounted && isCompact && (
                <ol className={sx.achList}>
                  {paData.map((item, idx) => (
                    <li
                      key={`${item.title}-${item.rightLabel}`}
                      className={`${ui.card} ${sx.achCard} ${item.scholarship ? ui.cardHighlighted : ""}`}
                    >
                      <div className={sx.achTop}>
                        <span className={ui.cardIndex}>{pad2(idx + 1)}</span>
                        <span className={ui.badge}><Flag country={item.country} />{item.rightLabel}</span>
                      </div>
                      <h3 className={`${sx.achTitle} ${item.scholarship ? sx.achTitleGold : ""}`}>
                        <Starred>{item.title}</Starred>
                      </h3>
                      <p className={sx.achSubtitle}>{item.subtitle}</p>
                    </li>
                  ))}
                </ol>
              )}
              {hasMounted && !isCompact && (
                <div
                  className={`${styles.verticalCarousel} ${sx.fadeY}`}
                  ref={projectsCarouselViewportRef}
                  data-lenis-prevent
                  tabIndex={0}
                  onMouseEnter={() => setIsCarouselHovered(true)}
                  onMouseLeave={() => setIsCarouselHovered(false)}
                  onFocus={() => setIsCarouselHovered(true)}
                  onBlur={() => setIsCarouselHovered(false)}
                  onTouchStart={handleProjectsTouchStart}
                  onTouchMove={handleProjectsTouchMove}
                  onTouchEnd={handleProjectsTouchEnd}
                  onTouchCancel={handleProjectsTouchEnd}
                >
                  <div ref={projectsCarouselTrackRef} className={styles.verticalCarouselTrack}>
                    {marqueePaData.map((item, idx) => (
                      <motion.div
                        className={`${ui.card} ${sx.achCard} ${item.scholarship ? ui.cardHighlighted : ""}`}
                        key={`${item.title}-${item.rightLabel}-${idx}`}
                        onPointerMove={trackSpotlight}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.1 }}
                        transition={{ duration: 0.7, ease: EASE_OUT }}
                      >
                        <div className={sx.achTop}>
                          <span className={ui.cardIndex}>{pad2((idx % paData.length) + 1)}</span>
                          <span className={ui.badge}><Flag country={item.country} />{item.rightLabel}</span>
                        </div>
                        <h3 className={`${sx.achTitle} ${item.scholarship ? sx.achTitleGold : ""}`}>
                          <Starred>{item.title}</Starred>
                        </h3>
                        <p className={sx.achSubtitle}>{item.subtitle}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* GitHub Projects Section */}
        <section
          className={`${styles.githubProjectsSection} ${sx.shell}`}
          data-section="GitHub"
        >
          <SectionBackdrop blue="top-right" gold="bottom-left" />
          <div className={styles.githubProjectsInner}>
            <div className={sx.ghHeader}>
              <h2 className={sx.ghTitle} data-perch="GitHub" data-perch-surface="text" {...reveal(0.05)}>
                <span className={ui.titleMain}><WaveText text="GITHUB" /></span>
                <span className={ui.titleSub}><WaveText text="PROJECTS" /></span>
              </h2>

              <div className={sx.ghIntro} {...reveal(0.15)}>
                <p className={sx.ghSubtitle}>
                  A few repositories I&apos;m proud of, each with a visual preview and quick context.
                </p>
                <div className={sx.ghToggle} role="group" aria-label="Which projects to show">
                  {[
                    { live: false, label: "All repos" },
                    { live: true, label: "Live demos" },
                  ].map((option) => {
                    const active = showLiveDemos === option.live;
                    return (
                      <button
                        key={option.label}
                        type="button"
                        className={`${sx.ghToggleBtn} ${active ? sx.ghToggleBtnActive : ""}`}
                        aria-pressed={active}
                        onClick={() => {
                          setIsGitHubCarouselPaused(false);
                          setShowLiveDemos(option.live);
                        }}
                      >
                        {active && (
                          <motion.span
                            layoutId="gh-toggle-pill"
                            className={sx.ghTogglePill}
                            transition={{ type: "spring", stiffness: 420, damping: 34 }}
                          />
                        )}
                        {option.live && <span className={sx.liveDot} aria-hidden="true" />}
                        <span className={sx.ghToggleLabel}>{option.label}</span>
                        {option.live && <span className={sx.ghToggleCount}>{LIVE_DEMOS.length}</span>}
                      </button>
                    );
                  })}
                </div>
                {showLiveDemos ? (
                  <p className={`${ui.hint} ${sx.hintLive}`}>
                    <span className={`${ui.hintDot} ${sx.hintDotLive}`} aria-hidden="true" />
                    <span>Free-tier servers may take a moment to wake up.</span>
                  </p>
                ) : isCompact ? (
                  <p className={ui.hint}>
                    <span className={ui.hintDot} aria-hidden="true" />
                    Swipe to browse <span aria-hidden="true">→</span>
                  </p>
                ) : (
                  <p className={`${ui.hint} ${sx.hoverOnly}`}>
                    <span className={ui.hintDot} aria-hidden="true" />
                    Hover to pause, read a README without leaving
                  </p>
                )}
              </div>
            </div>

            <AnimatePresence mode="wait" initial={false}>
            {showLiveDemos ? (
              <motion.div
                key="live-demos"
                className={sx.liveGrid}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.35, ease: EASE_OUT }}
              >
                {LIVE_DEMOS.map((demo, index) => {
                  const repoUrl = `https://github.com/3llimi/${demo.repoName}`;
                  const isFrontendOnly = demo.status === "frontend";
                  return (
                    <motion.article
                      key={demo.repoName}
                      className={`${ui.card} ${sx.liveCard}`}
                      data-perch="GitHub"
                      onPointerMove={isCompact ? undefined : trackSpotlight}
                      initial={{ opacity: 0, y: 28, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.6, delay: 0.08 + index * 0.09, ease: EASE_OUT }}
                    >
                      {/* Browser-window chrome around the screenshot */}
                      <div className={sx.liveChrome}>
                        <span className={sx.liveLights} aria-hidden="true">
                          <i /><i /><i />
                        </span>
                        <span className={sx.liveAddress}>
                          <svg viewBox="0 0 16 16" width="11" height="11" aria-hidden="true">
                            <path
                              fill="currentColor"
                              d="M8 1a3.5 3.5 0 0 0-3.5 3.5V7H4a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1h-.5V4.5A3.5 3.5 0 0 0 8 1Zm2 6H6V4.5a2 2 0 1 1 4 0V7Z"
                            />
                          </svg>
                          <span className={sx.liveAddressText}>{urlHost(demo.url)}</span>
                        </span>
                        <span className={`${sx.liveBadge} ${isFrontendOnly ? sx.liveBadgeFrontend : ""}`}>
                          <span className={sx.liveDot} aria-hidden="true" />
                          {isFrontendOnly ? "Front end" : "Live"}
                        </span>
                      </div>

                      <a
                        href={demo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={sx.liveScreen}
                        aria-label={`Open the ${demo.title} live demo`}
                      >
                        <Image src={getImagePath(demo.cover)} alt="" width={900} height={520} />
                        <span className={sx.liveScreenCta} aria-hidden="true">
                          Launch app <span className={ui.arrow}>↗</span>
                        </span>
                      </a>

                      <div className={sx.liveBody}>
                        <div className={sx.liveHead}>
                          <span className={ui.cardIndex}>{pad2(index + 1)}</span>
                          <h3 className={sx.ghCardTitle}>{demo.title}</h3>
                        </div>
                        <p className={sx.liveTagline}>{demo.tagline}</p>
                        <ul className={sx.liveStack} aria-label="Tech stack">
                          {demo.stack.map((tech) => (
                            <li key={tech} className={ui.badge}>{tech}</li>
                          ))}
                        </ul>
                        {demo.note && (
                          <p className={sx.liveNote}>
                            <span className={sx.liveNoteIcon} aria-hidden="true">i</span>
                            {demo.note}
                          </p>
                        )}
                        {demo.login && (
                          <div className={sx.liveLogin}>
                            <span className={sx.liveLoginTitle}>Demo login</span>
                            <dl className={sx.liveCreds}>
                              <CopyField label="Email" value={demo.login.email} />
                              <CopyField label="Password" value={demo.login.password} />
                            </dl>
                          </div>
                        )}
                        <div className={sx.liveActions}>
                          <div className={sx.ghButtons}>
                            <a
                              href={demo.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`${ui.btn} ${ui.btnPrimary}`}
                            >
                              Open live demo <span className={ui.arrow} aria-hidden="true">↗</span>
                            </a>
                            {demo.extraLinks?.map((link) => (
                              <a
                                key={link.href}
                                href={link.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={ui.btn}
                              >
                                {link.label} <span className={ui.arrow} aria-hidden="true">↗</span>
                              </a>
                            ))}
                          </div>
                          <a href={repoUrl} target="_blank" rel="noopener noreferrer" className={ui.linkMono}>
                            {repoPath(repoUrl)}
                            <span className={ui.arrow} aria-hidden="true">↗</span>
                          </a>
                        </div>
                      </div>
                    </motion.article>
                  );
                })}
              </motion.div>
            ) : (
            <motion.div
              key="all-repos"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35, ease: EASE_OUT }}
            >
            <div
              ref={githubCarouselViewportRef}
              className={`${styles.githubCarouselViewport} ${isCompact ? sx.ghScroller : sx.fadeX}`}
              data-lenis-prevent
              tabIndex={0}
              onMouseEnter={isCompact ? undefined : () => setIsGitHubCarouselPaused(true)}
              onMouseLeave={isCompact ? undefined : () => setIsGitHubCarouselPaused(false)}
              onFocus={isCompact ? undefined : () => setIsGitHubCarouselPaused(true)}
              onBlur={isCompact ? undefined : () => setIsGitHubCarouselPaused(false)}
              onTouchStart={isCompact ? undefined : handleGitHubTouchStart}
              onTouchMove={isCompact ? undefined : handleGitHubTouchMove}
              onTouchEnd={isCompact ? undefined : handleGitHubTouchEnd}
              onTouchCancel={isCompact ? undefined : handleGitHubTouchEnd}
            >
              <div ref={githubCarouselTrackRef} className={styles.githubCarouselTrack}>
                {marqueeGithubProjects.map((project, index) => (
                  <article
                    key={`${project.id}-${index}`}
                    className={`${ui.card} ${sx.ghCard}`}
                    data-project-card
                    data-perch="GitHub"
                    onPointerMove={isCompact ? undefined : trackSpotlight}
                    // Swipe list (.ghScroller) turns the reveal off in CSS, so the next card's edge is
                    // visible right away as a "swipe me" cue
                    {...reveal(Math.min(index, 3) * 0.08)}
                  >
                    <div className={sx.ghCover}>
                      <Image
                        src={getImagePath(project.cover)}
                        alt={`${project.title} cover`}
                        width={900}
                        height={520}
                      />
                      {(() => {
                        const demo = liveDemoByRepo.get(project.title.toLowerCase());
                        if (!demo) return null;
                        const isFrontendOnly = demo.status === "frontend";
                        return (
                          <a
                            href={demo.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`${sx.liveBadge} ${sx.ghCoverBadge} ${isFrontendOnly ? sx.liveBadgeFrontend : ""}`}
                            aria-label={`Open the ${project.title} live demo`}
                          >
                            <span className={sx.liveDot} aria-hidden="true" />
                            {isFrontendOnly ? "Front end" : "Live"} <span className={ui.arrow} aria-hidden="true">↗</span>
                          </a>
                        );
                      })()}
                    </div>

                    <div className={sx.ghContent}>
                      <h3 className={sx.ghCardTitle}>{project.title}</h3>
                      <p className={sx.ghDesc}>{project.description}</p>
                      <div className={sx.ghActions}>
                        <div className={sx.ghButtons}>
                          {project.contributionRole && (
                            <button
                              type="button"
                              className={`${ui.btn} ${ui.btnPrimary}`}
                              onClick={() => handleContributionClick(project)}
                            >
                              My Contribution
                            </button>
                          )}
                          {!isCompact && (
                            <button type="button" className={ui.btn} onClick={() => handleReadmeClick(project)}>
                              Read README
                            </button>
                          )}
                        </div>
                        <a href={project.repoUrl} target="_blank" rel="noopener noreferrer" className={ui.linkMono}>
                          {repoPath(project.repoUrl)}
                          <span className={ui.arrow} aria-hidden="true">↗</span>
                        </a>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
            </motion.div>
            )}
            </AnimatePresence>

          </div>
        </section>

        <AnimatePresence>
          {readmeTitle && (
            <motion.div
              className={styles.githubReadmeOverlay}
              role="dialog"
              aria-modal="true"
              aria-label={`${readmeTitle} README`}
              onClick={closeReadmeOverlay}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <motion.div
                className={styles.githubReadmePanel}
                onClick={(event) => event.stopPropagation()}
                {...dialogPanelMotion}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                <div className={styles.githubReadmeHeader}>
                  <h3 className={styles.githubReadmeTitle}>
                    <span className={styles.githubReadmeEyebrow}>README</span>
                    {readmeTitle}
                  </h3>
                  <div className={styles.githubReadmeHeaderActions}>
                    {readmeRepoUrl && (
                      <a href={readmeRepoUrl} target="_blank" rel="noopener noreferrer" className={ui.btn}>
                        Open Repo <span className={ui.arrow} aria-hidden="true">↗</span>
                      </a>
                    )}
                    <button type="button" className={ui.iconButton} onClick={closeReadmeOverlay} aria-label="Close">
                      <span className={ui.closeIcon} aria-hidden="true" />
                    </button>
                  </div>
                </div>

                {isReadmeLoading && <p className={styles.githubReadmeMeta}>Loading README...</p>}
                {!isReadmeLoading && readmeError && (
                  <p className={styles.githubReadmeMeta}>{readmeError}</p>
                )}
                {!isReadmeLoading && !readmeError && readmeContent && (
                  <div className={styles.githubReadmeContent}>
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeRaw, rehypeSanitize]}
                      components={readmeHeadingComponents}
                    >
                      {readmeContent}
                    </ReactMarkdown>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {activeContribution && (
            <motion.div
              className={styles.githubReadmeOverlay}
              role="dialog"
              aria-modal="true"
              aria-label={`${activeContribution.title} contribution and role`}
              onClick={closeContributionOverlay}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <motion.div
                className={styles.githubReadmePanel}
                onClick={(event) => event.stopPropagation()}
                {...dialogPanelMotion}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                <div className={styles.githubReadmeHeader}>
                  <h3 className={styles.githubReadmeTitle}>
                    <span className={styles.githubReadmeEyebrow}>Contribution &amp; role</span>
                    {activeContribution.title}
                  </h3>
                  <div className={styles.githubReadmeHeaderActions}>
                    <button type="button" className={ui.iconButton} onClick={closeContributionOverlay} aria-label="Close">
                      <span className={ui.closeIcon} aria-hidden="true" />
                    </button>
                  </div>
                </div>

                <div className={styles.githubReadmeContent}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={readmeHeadingComponents}>
                    {activeContribution.content}
                  </ReactMarkdown>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <footer
          className={`${styles.footer} ${sx.shell} ${sx.footer}`}
          data-section="Contact"
        >
          <SectionBackdrop blue="none" gold="bottom-right" />
          <div className={sx.footerInner}>
            <div className={sx.footerTop}>
              <div {...reveal(0.05)}>
                <h2 className={`${ui.titleMain} ${sx.footerTitle}`} data-perch="Contact" data-perch-surface="text"><WaveText text="GET IN TOUCH" /></h2>
                <p className={sx.footerLead}>Have a project or an opportunity in mind? Let&apos;s talk.</p>
              </div>

              <div className={sx.footerLinks}>
                {SOCIAL_LINKS.map((social, index) => (
                  <a
                    key={social.platform}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${ui.card} ${sx.socialCard}`}
                    data-perch="Contact"
                    onPointerMove={trackSpotlight}
                    {...reveal(0.15 + index * 0.08)}
                  >
                    <span className={sx.socialIcon}>
                      <Image src={getImagePath(social.icon)} alt="" width={24} height={24} />
                    </span>
                    <span className={sx.socialText}>
                      <span className={sx.socialName}>{social.alt}</span>
                      <span className={sx.socialHandle}>{social.handle}</span>
                    </span>
                    <span className={ui.arrow} aria-hidden="true">↗</span>
                  </a>
                ))}
              </div>
            </div>

            <div className={sx.footerBottom} data-livesey-ground data-nav-avoid>
              <p className={sx.copyright}>
                © 2024–{new Date().getFullYear()} Designed &amp; developed by Ahmed Baha Eddine Alimi
              </p>
              <button
                type="button"
                className={ui.btn}
                onClick={() => scrollToY(0, { duration: 1.6 })}
              >
                Back to top <span aria-hidden="true">↑</span>
              </button>
            </div>
          </div>
        </footer>

        {/* Smooth scrolling, custom scrollbar and our tour guide */}
        {/* Phones/tablets keep native touch scrolling: no Lenis, no nav dock, no Doctor Livesey */}
        {hasMounted && (
          <>
            {!isCompact && <SmoothScroll />}
            <ScrollRail />
            {!isCompact && <SectionNav />}
            {!isCompact && <LiveseyGuide />}
          </>
        )}
      </div>
    </>
  );
}
