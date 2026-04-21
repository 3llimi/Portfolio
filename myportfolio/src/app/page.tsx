"use client";
import Image from "next/image";
import styles from "./page.module.css";
import React, { useCallback, useEffect, useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import remarkGfm from "remark-gfm";

// Helper function to get the correct image path for GitHub Pages
const getImagePath = (path: string) => {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
  return `${basePath}${path}`;
};

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

const fallbackCovers = [
  "/images/portfolio-1.jpg",
  "/images/portfolio-2.jpg",
  "/images/portfolio-3.jpg",
];

const fallbackGithubProjects: GitHubProjectCard[] = [
  {
    id: 1,
    title: "Portfolio Website",
    description:
      "Personal portfolio built with Next.js and Framer Motion with responsive sections, custom interactions, and GitHub Pages deployment.",
    cover: "/images/portfolio-1.jpg",
    repoUrl: "https://github.com/3llimi/Portfolio",
  },
  {
    id: 2,
    title: "InnoSync",
    description:
      "Team project where I led frontend implementation and design, focusing on clean UI structure and scalable component-driven development.",
    cover: "/images/portfolio-2.jpg",
    repoUrl: "https://github.com/3llimi",
  },
  {
    id: 3,
    title: "Hackathon Projects",
    description:
      "A collection of rapid prototypes and problem-solving builds from hackathons, with practical UI and backend integration work.",
    cover: "/images/portfolio-3.jpg",
    repoUrl: "https://github.com/3llimi?tab=repositories",
  },
];

// Add exact GitHub repo names here to control which repos are shown.
// Leave empty to show top repositories automatically.
const selectedRepos: SelectedRepoConfig[] = [
  {
    repoName: "GPTitorSWP",
    cover: "/images/Gptitor.jpg",
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
    cover: "/images/Innosync.jpg",
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
    cover: "/images/compiler.png",
    description:
      "A hands-on course repository covering core compiler design, from lexical analysis and parsing to semantic checks and code generation, The implementation was in rust.",
  },
  {
    repoName: "BookTrackerApp-SQRS-S26",
    cover: "/images/BookTrackerApp.png",
    description:
      "A personal book collection tracker built with FastAPI, Streamlit, and the Open Library API. Part of the Software Quality, Reliability and Security (SQRS) course — Spring 2026 semester",
  },
  {
    repoName: "DevSecOps-Intro",
    cover: "/images/devsecops.jpg",
    description:
      "An introductory repository that teaches how to integrate security into every stage of the DevOps lifecycle using practical workflows and tooling.",
  },
  {
    repoName: "ThreatHound",
    cover: "/images/Threathound.jpg",
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
    cover: "/images/devops_loop.jpg",
    description:
      "A foundational DevOps course repository focused on CI/CD, automation, infrastructure practices, and reliable software delivery.",
  },
  {
    repoName: "ACCPA",
    cover: "/images/ACCPA.png",
    description:
      "The Great Type Checker of STELLA: a Rust-built ACCPA implementation spanning three stages, with core and advanced language features, type reconstruction, universal types, and precise ERROR_* diagnostics.",
  },
];

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

export default function Home() {
  const [githubProjects, setGithubProjects] = useState<GitHubProjectCard[]>(fallbackGithubProjects);
  const [isGitHubCarouselPaused, setIsGitHubCarouselPaused] = useState(false);
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
  const [readmeError, setReadmeError] = useState<string | null>(null);
  const [isReadmeLoading, setIsReadmeLoading] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const [activeContribution, setActiveContribution] = useState<{
    title: string;
    content: string;
  } | null>(null);
  const marqueeGithubProjects = useMemo(
    () => (githubProjects.length > 0 ? [...githubProjects, ...githubProjects] : []),
    [githubProjects]
  );

  useEffect(() => {
    isGitHubCarouselPausedRef.current = isGitHubCarouselPaused;
  }, [isGitHubCarouselPaused]);

  const paData = [
    {
      title: "*IOT4TUNISIA BOOTCAMP",
      rightLabel: "MentorNations 20-21",
      subtitle: "DESIGNER & WEB DEVELOPER",
      scholarship: false,
    },
    {
      title: "*HackUrWaste HACKATHON",
      rightLabel: "MentorNations 22",
      subtitle: "MENTOR",
      scholarship: false,
    },
    {
      title: "*Tunisian National Olympiad in Informatics",
      rightLabel: "ITA 22",
      subtitle: "Contestant",
      scholarship: false,
    },
    {
      title: "*Upside Education HACKATHON",
      rightLabel: "GOMYCODE 22",
      subtitle: "DESIGNER & WEB DEVELOPER",
      scholarship: false,
    },
    {
      title: "*Winner of The Full Russian Government Scholarship*",
      rightLabel: "23-27",
      subtitle: "CURRENTLY A COMPUTER SCIENCE STUDENT IN INNOPOLIS UNIVERSITY",
      scholarship: true,
    },
    {
      title: "*LIGHTS CAMERA LEARN",
      rightLabel: "Session 22 & 23",
      subtitle: "BTS PHOTOGRAPHER & VIDEOGRAPHER",
      scholarship: false,
    },
    {
      title: "*Adanced Engineering School",
      rightLabel: "June 24 - Dec 24",
      subtitle: "Junior GUI Developer",
      scholarship: false,
    },
    {
      title: "*Kazan TechArena HACKATHON",
      rightLabel: "Huawei 25",
      subtitle: "Contestant",
      scholarship: false,
    },
    {
      title: "*InnoSync",
      rightLabel: "Innopolis University 25",
      subtitle: "Team Lead - Frontend Dev - Designer",
      scholarship: false,
    },
  ];
  const marqueePaData = paData.length > 0 ? [...paData, ...paData] : [];

  // Custom cursor refs for high-frequency pointer updates without re-rendering
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const cursorPositionRef = useRef({ x: 0, y: 0 });
  const cursorRafRef = useRef<number | null>(null);
  const [showCursor, setShowCursor] = useState(true);

  // Helper to detect mobile
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 600;

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
    if (!track || githubProjects.length === 0) {
      githubMarqueeOffsetRef.current = 0;
      githubMarqueeLoopWidthRef.current = 0;
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
  }, [githubProjects.length, marqueeGithubProjects.length]);

  useEffect(() => {
    if (!hasMounted) {
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
  }, [hasMounted, setGitHubMarqueeOffset]);

  useEffect(() => {
    if (githubProjects.length === 0) {
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
  }, [githubProjects.length, setGitHubMarqueeOffset]);

  const handleReadmeClick = async (project: GitHubProjectCard) => {
    const repoInfo = extractOwnerAndRepo(project.repoUrl);

    setReadmeTitle(project.title);
    setReadmeRepoUrl(project.repoUrl);
    setReadmeContent("");
    setReadmeError(null);

    if (!repoInfo) {
      setReadmeError("Could not parse repository path from this project link.");
      return;
    }

    setIsReadmeLoading(true);

    try {
      const response = await fetch(`https://api.github.com/repos/${repoInfo.owner}/${repoInfo.repo}/readme`, {
        headers: {
          Accept: "application/vnd.github.raw+json",
        },
      });

      if (!response.ok) {
        throw new Error(`README request failed with ${response.status}`);
      }

      const content = await response.text();
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

    const previousOverflow = document.body.style.overflow;
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

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
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
    // Hide cursor on mobile (<=600px)
    const handleResize = () => {
      setShowCursor(window.innerWidth > 600);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
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

  // Navigation functions
  const sectionScrollRafRef = useRef<number | null>(null);

  const getSectionAnchors = () => {
    const sectionClassNames = [
      styles.hero,
      styles.aboutSection,
      styles.skillsSection,
      styles.projectsAchievementsSection,
      styles.githubProjectsSection,
      styles.footer,
    ];

    const anchors = sectionClassNames
      .map((className) => document.querySelector<HTMLElement>(`.${className}`))
      .filter((section): section is HTMLElement => section !== null)
      .map((section) => Math.round(section.getBoundingClientRect().top + window.scrollY))
      .filter((position, index, all) => all.indexOf(position) === index)
      .sort((a, b) => a - b);

    if (anchors.length === 0 || anchors[0] !== 0) {
      anchors.unshift(0);
    }

    return anchors;
  };

  const animateWindowScroll = useCallback((targetTop: number) => {
    const startTop = window.scrollY;
    const maxScrollTop = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    const boundedTargetTop = Math.min(maxScrollTop, Math.max(0, Math.round(targetTop)));
    const distance = boundedTargetTop - startTop;

    if (Math.abs(distance) < 2) {
      window.scrollTo({ top: boundedTargetTop, behavior: "auto" });
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      window.scrollTo({ top: boundedTargetTop, behavior: "auto" });
      return;
    }

    if (sectionScrollRafRef.current !== null) {
      cancelAnimationFrame(sectionScrollRafRef.current);
      sectionScrollRafRef.current = null;
    }

    const durationMs = Math.min(850, Math.max(380, Math.abs(distance) * 0.55));
    const startTime = performance.now();

    const easeInOutCubic = (progress: number) =>
      progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;

    const step = (now: number) => {
      const progress = Math.min((now - startTime) / durationMs, 1);
      const easedProgress = easeInOutCubic(progress);
      window.scrollTo({
        top: startTop + distance * easedProgress,
        behavior: "auto",
      });

      if (progress < 1) {
        sectionScrollRafRef.current = requestAnimationFrame(step);
      } else {
        sectionScrollRafRef.current = null;
      }
    };

    sectionScrollRafRef.current = requestAnimationFrame(step);
  }, []);

  useEffect(() => {
    return () => {
      if (sectionScrollRafRef.current !== null) {
        cancelAnimationFrame(sectionScrollRafRef.current);
        sectionScrollRafRef.current = null;
      }
    };
  }, []);

  const scrollToSectionInDirection = (direction: 1 | -1) => {
    const anchors = getSectionAnchors();
    if (anchors.length === 0) {
      return;
    }

    const marker = window.scrollY + window.innerHeight * 0.42;
    let currentIndex = 0;

    for (let index = 0; index < anchors.length; index += 1) {
      if (marker >= anchors[index]) {
        currentIndex = index;
      } else {
        break;
      }
    }

    const targetIndex = Math.min(
      anchors.length - 1,
      Math.max(0, currentIndex + direction)
    );

    animateWindowScroll(anchors[targetIndex]);
  };

  const scrollToNextSection = () => {
    scrollToSectionInDirection(1);
  };

  const scrollToPreviousSection = () => {
    scrollToSectionInDirection(-1);
  };

  // State for showing/hiding navigation bubbles
  const [atTop, setAtTop] = useState(true);
  const [atBottom, setAtBottom] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;
      setAtTop(scrollY <= 10);
      setAtBottom(scrollY + windowHeight >= docHeight - 10);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  // Ref for skills section
  const skillsSectionRef = useRef<HTMLDivElement | null>(null);
  const [skillsActive, setSkillsActive] = useState(false);

  useEffect(() => {
    const handleSkillsSection = () => {
      if (!skillsSectionRef.current) return;
      const rect = skillsSectionRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      // Section is considered active if at least 40% is visible
      const visible = rect.top < windowHeight * 0.6 && rect.bottom > windowHeight * 0.4;
      setSkillsActive(visible);
    };
    handleSkillsSection();
    window.addEventListener('scroll', handleSkillsSection);
    window.addEventListener('resize', handleSkillsSection);
    return () => {
      window.removeEventListener('scroll', handleSkillsSection);
      window.removeEventListener('resize', handleSkillsSection);
    };
  }, []);

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
    if (!hasMounted) {
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
  }, [applyProjectsMarqueeTransform, hasMounted, marqueePaData.length, paData.length]);

  useEffect(() => {
    if (!hasMounted) {
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
  }, [hasMounted, setProjectsMarqueeOffset]);

  useEffect(() => {
    if (!hasMounted || paData.length === 0) {
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
  }, [hasMounted, paData.length, setProjectsMarqueeOffset]);

  // Refs for continuous marquee in Skills section
  const skillsMarqueeViewportRef = useRef<HTMLDivElement | null>(null);
  const skillsMarqueeTrackRef = useRef<HTMLDivElement | null>(null);
  const skillsMarqueeOffsetRef = useRef(0);
  const skillsMarqueeLoopHeightRef = useRef(0);
  const skillsMarqueeRafRef = useRef<number | null>(null);
  const skillsMarqueeLastTimestampRef = useRef<number | null>(null);
  const skillsTouchYRef = useRef<number | null>(null);
  const [isSkillsHovered, setIsSkillsHovered] = useState(false);

  const applySkillsMarqueeTransform = useCallback((offset: number) => {
    const track = skillsMarqueeTrackRef.current;
    if (!track) {
      return;
    }

    track.style.transform = `translate3d(0, -${offset}px, 0)`;
  }, []);

  const setSkillsMarqueeOffset = useCallback((rawOffset: number) => {
    const loopHeight = skillsMarqueeLoopHeightRef.current;
    if (loopHeight <= 0) {
      return;
    }

    const normalizedOffset = ((rawOffset % loopHeight) + loopHeight) % loopHeight;
    skillsMarqueeOffsetRef.current = normalizedOffset;
    applySkillsMarqueeTransform(normalizedOffset);
  }, [applySkillsMarqueeTransform]);

  const handleSkillsTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    setIsSkillsHovered(true);
    skillsTouchYRef.current = event.touches[0]?.clientY ?? null;
  };

  const handleSkillsTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    if (skillsMarqueeLoopHeightRef.current <= 0) {
      return;
    }

    const currentY = event.touches[0]?.clientY;
    if (currentY === undefined || skillsTouchYRef.current === null) {
      return;
    }

    event.preventDefault();
    const deltaY = skillsTouchYRef.current - currentY;
    skillsTouchYRef.current = currentY;
    setSkillsMarqueeOffset(skillsMarqueeOffsetRef.current + deltaY);
  };

  const handleSkillsTouchEnd = () => {
    skillsTouchYRef.current = null;
    setIsSkillsHovered(false);
  };

  useEffect(() => {
    if (!hasMounted) {
      return;
    }

    const viewport = skillsMarqueeViewportRef.current;
    if (!viewport) {
      return;
    }

    const handleWheel = (event: WheelEvent) => {
      if (skillsMarqueeLoopHeightRef.current <= 0) {
        return;
      }

      event.preventDefault();
      setIsSkillsHovered(true);
      setSkillsMarqueeOffset(skillsMarqueeOffsetRef.current + event.deltaY);
    };

    viewport.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      viewport.removeEventListener("wheel", handleWheel);
    };
  }, [hasMounted, setSkillsMarqueeOffset]);

  useEffect(() => {
    if (!hasMounted) {
      return;
    }

    const track = skillsMarqueeTrackRef.current;
    if (!track) {
      skillsMarqueeOffsetRef.current = 0;
      skillsMarqueeLoopHeightRef.current = 0;
      return;
    }

    const updateLoopHeight = () => {
      const loopHeight = track.scrollHeight / 2;
      skillsMarqueeLoopHeightRef.current = Number.isFinite(loopHeight) ? loopHeight : 0;

      if (skillsMarqueeLoopHeightRef.current <= 0) {
        skillsMarqueeOffsetRef.current = 0;
      } else if (skillsMarqueeOffsetRef.current >= skillsMarqueeLoopHeightRef.current) {
        skillsMarqueeOffsetRef.current %= skillsMarqueeLoopHeightRef.current;
      }

      applySkillsMarqueeTransform(skillsMarqueeOffsetRef.current);
    };

    updateLoopHeight();

    const resizeObserver = new ResizeObserver(updateLoopHeight);
    resizeObserver.observe(track);

    const viewport = skillsMarqueeViewportRef.current;
    if (viewport) {
      resizeObserver.observe(viewport);
    }

    window.addEventListener("resize", updateLoopHeight);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateLoopHeight);
    };
  }, [hasMounted, applySkillsMarqueeTransform]);

  useEffect(() => {
    if (!hasMounted || isSkillsHovered) {
      return;
    }

    const speedPxPerSecond = 26;

    const step = (timestamp: number) => {
      if (skillsMarqueeLastTimestampRef.current === null) {
        skillsMarqueeLastTimestampRef.current = timestamp;
      }

      const elapsedSeconds = (timestamp - skillsMarqueeLastTimestampRef.current) / 1000;
      skillsMarqueeLastTimestampRef.current = timestamp;

      const loopHeight = skillsMarqueeLoopHeightRef.current;
      if (loopHeight > 0) {
        const nextOffset = skillsMarqueeOffsetRef.current + speedPxPerSecond * elapsedSeconds;
        setSkillsMarqueeOffset(nextOffset);
      }

      skillsMarqueeRafRef.current = requestAnimationFrame(step);
    };

    skillsMarqueeRafRef.current = requestAnimationFrame(step);

    return () => {
      if (skillsMarqueeRafRef.current !== null) {
        cancelAnimationFrame(skillsMarqueeRafRef.current);
        skillsMarqueeRafRef.current = null;
      }
      skillsMarqueeLastTimestampRef.current = null;
    };
  }, [isSkillsHovered, hasMounted, setSkillsMarqueeOffset]);

  type SkillItem = {
    icon: string;
    alt: string;
    label: string;
  };

  type SkillGroupConfig = {
    title: string;
    items: SkillItem[];
    groupDelay: number;
    headingDelay: number;
    itemDelayStart: number;
  };

  const skillGroups: SkillGroupConfig[] = [
    {
      title: "*UI/UX Design",
      items: [{ icon: "/icons/figma.svg", alt: "Figma", label: "*Figma" }],
      groupDelay: 0.2,
      headingDelay: 0.3,
      itemDelayStart: 0.4,
    },
    {
      title: "*Front-End Development",
      items: [
        { icon: "/icons/html5.svg", alt: "HTML5", label: "*HTML5" },
        { icon: "/icons/css3.svg", alt: "CSS3", label: "*CSS3" },
        { icon: "/icons/javascript.svg", alt: "JavaScript", label: "*JavaScript" },
        { icon: "/icons/typescript.svg", alt: "TypeScript", label: "*TypeScript" },
        { icon: "/icons/angular.svg", alt: "Angular", label: "*Angular" },
        { icon: "/icons/flutter.svg", alt: "flutter", label: "*Flutter" },
      ],
      groupDelay: 0.3,
      headingDelay: 0.4,
      itemDelayStart: 0.5,
    },
    {
      title: "*Back-End Development",
      items: [
        { icon: "/icons/nodejs.svg", alt: "Node.js", label: "*Node.js" },
        { icon: "/icons/postgresql.svg", alt: "PostgreSQL", label: "*PostgreSQL" },
        { icon: "/icons/mongodb.svg", alt: "MongoDB", label: "*MongoDB" },
        { icon: "/icons/mysql.svg", alt: "MySQL", label: "*MySQL" },
        { icon: "/icons/php.svg", alt: "PHP", label: "*PHP" },
        { icon: "/icons/docker.svg", alt: "Docker", label: "*Docker" },
        { icon: "/icons/go.svg", alt: "Go", label: "*GoLang" },
      ],
      groupDelay: 0.4,
      headingDelay: 0.5,
      itemDelayStart: 0.6,
    },
    {
      title: "*DevOps",
      items: [
        { icon: "/icons/kubernetes-svgrepo-com.svg", alt: "Kubernetes", label: "*Kubernetes" },
        { icon: "/icons/terraform-svgrepo-com.svg", alt: "Terraform", label: "*Terraform" },
        { icon: "/icons/ansible-svgrepo-com.svg", alt: "Ansible", label: "*Ansible" },
        { icon: "/icons/Helm.svg", alt: "Helm", label: "*Helm" },
        { icon: "/icons/Argo CD.svg", alt: "Argo CD", label: "*Argo CD" },
        { icon: "/icons/prometheus-svgrepo-com.svg", alt: "Prometheus", label: "*Prometheus" },
        { icon: "/icons/grafana-svgrepo-com.svg", alt: "Grafana", label: "*Grafana" },
      ],
      groupDelay: 0.5,
      headingDelay: 0.6,
      itemDelayStart: 0.7,
    },
    {
      title: "*Programming",
      items: [
        { icon: "/icons/python.svg", alt: "Python", label: "*Python" },
        { icon: "/icons/csharp.svg", alt: "C#", label: "*C#" },
        { icon: "/icons/cpp.svg", alt: "C++", label: "*C++" },
        { icon: "/icons/c.svg", alt: "C", label: "*C" },
        { icon: "/icons/java.svg", alt: "Java", label: "*Java" },
        { icon: "/icons/arduino.svg", alt: "Arduino", label: "*Arduino" },
        { icon: "/icons/rust-svgrepo-com.svg", alt: "Rust", label: "*Rust" },
      ],
      groupDelay: 0.6,
      headingDelay: 0.7,
      itemDelayStart: 0.7,
    },
    {
      title: "*Photography",
      items: [{ icon: "/icons/lightroom.svg", alt: "Lightroom", label: "*Lightroom" }],
      groupDelay: 0.6,
      headingDelay: 0.7,
      itemDelayStart: 0.8,
    },
  ];

  const renderSkillGroups = (cloneKey: string) => (
    <>
      {skillGroups.map((group) => (
        <motion.div
          key={`${group.title}-${cloneKey}`}
          className={styles.skillGroup}
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.7 }}
          transition={{ duration: 0.8, delay: group.groupDelay, type: "spring", stiffness: 100 }}
        >
          <motion.h3
            className={styles.groupTitle}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.7 }}
            transition={{ duration: 0.6, delay: group.headingDelay }}
          >
            {group.title}
          </motion.h3>
          <div className={styles.skillsRow}>
            {group.items.map((skill, index) => (
              <motion.div
                key={`${skill.alt}-${cloneKey}`}
                className={styles.skillItem}
                initial={{ opacity: 0, scale: 0, rotateY: 90 }}
                whileInView={{ opacity: 1, scale: 1, rotateY: 0 }}
                viewport={{ once: true, amount: 0.7 }}
                transition={{
                  duration: 0.6,
                  delay: group.itemDelayStart + index * 0.1,
                  type: "spring",
                  stiffness: 200,
                  damping: 15,
                }}
                whileHover={{
                  rotateY: 10,
                  transition: { duration: 0.2 },
                }}
              >
                <div className={styles.skillIconLarge}>
                  <Image src={getImagePath(skill.icon)} alt={skill.alt} width={40} height={40} />
                </div>
                <span className={styles.skillLabel}>{skill.label}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      ))}
    </>
  );

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
        {/* Hero Section - Exact Figma Match */}
        <motion.section
          className={styles.hero}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {/* Background Image */}
          <div className={styles.heroBackground}>
            <Image
              src={getImagePath("/images/hero-bg.jpg")}
              alt="Hero background"
              fill
              className={styles.heroImage}
              priority
            />
            <div className={styles.heroOverlay}></div>
          </div>
          {/* Content Container */}
          <div className={styles.heroContent}>
            {/* Mobile: Picture first, then writing, then social links */}
            {isMobile ? (
              <>
                {/* Profile Image */}
                <motion.div
                  className={styles.heroImageContainer}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, amount: 0.7 }}
                  transition={{ duration: 0.7, delay: 0.5 }}
                  style={{ margin: '0.7rem auto 0.3rem auto' }}
                >
                  <Image
                    src={getImagePath("/images/profile-photo.png")}
                    alt="Ahmed Baha Eddine Alimi"
                    width={110}
                    height={110}
                    className={styles.profileImage}
                    priority
                  />
                </motion.div>
                {/* Name, Title, Subtitle */}
                <motion.h1
                  className={styles.heroName}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.7 }}
                  transition={{ duration: 0.7, delay: 0.2 }}
                  style={{ marginBottom: '0.08rem', marginTop: '0.3rem', gap: '0.05rem' }}
                >
                  <span className={styles.lastName}>
                    <span className={styles.rotatingStar}>*</span>Alimi
                  </span>
                  <span className={styles.firstName}>Ahmed Baha Eddine</span>
                </motion.h1>
                <motion.p
                  className={styles.heroTitle}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.7 }}
                  transition={{ duration: 0.7, delay: 0.3 }}
                  style={{ marginBottom: '0.05rem' }}
                >
                  Comp Sci Student
                </motion.p>
                <motion.p
                  className={styles.heroSubtitle}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.7 }}
                  transition={{ duration: 0.7, delay: 0.4 }}
                  style={{ marginBottom: '0.05rem' }}
                >
                  At Innopolis University
                </motion.p>
                {/* Social Links Container (Mobile) */}
                <motion.div
                  className={styles.socialLinksContainer}
                  initial={{ opacity: 0, y: 30, scale: 0.8 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true, amount: 0.7 }}
                  transition={{
                    duration: 0.8,
                    delay: 0.6,
                    type: "spring",
                    stiffness: 100,
                    damping: 10
                  }}
                  style={{ position: 'static', margin: '0.4rem auto 0 auto', width: '100%', maxWidth: 320, background: 'rgba(30,30,30,0.97)' }}
                >
                  <div className={styles.socialLinks} style={{ justifyContent: 'center', width: '100%', gap: 14 }}>
                    {[
                      { href: "#", platform: "upwork", icon: getImagePath("/icons/upwork.svg"), alt: "Upwork" },
                      { href: "https://t.me/Allimi3", platform: "telegram", icon: getImagePath("/icons/telegram.svg"), alt: "Telegram" },
                      { href: "https://www.behance.net/bahaallimi1", platform: "behance", icon: getImagePath("/icons/behance.svg"), alt: "Behance" },
                      { href: "https://github.com/3llimi", platform: "github", icon: getImagePath("/icons/github.svg"), alt: "GitHub" },
                      { href: "https://www.linkedin.com/in/ahmed-baha-eddine-alimi/", platform: "linkedin", icon: getImagePath("/icons/linkedin.svg"), alt: "LinkedIn" },
                      { href: "https://www.instagram.com/3llimi/", platform: "instagram", icon: getImagePath("/icons/instagram.svg"), alt: "Instagram" }
                    ].map((social, index) => (
                      <motion.a
                        key={social.platform}
                        href={social.href}
                        className={styles.socialLink}
                        data-platform={social.platform}
                        aria-label={social.alt}
                        initial={{ opacity: 0, scale: 0, rotate: -180 }}
                        whileInView={{
                          opacity: 1,
                          scale: 1,
                          rotate: 0,
                          transition: {
                            duration: 0.6,
                            delay: 0.8 + index * 0.1,
                            type: "spring",
                            stiffness: 200,
                            damping: 15
                          }
                        }}
                        viewport={{ once: true, amount: 0.7 }}
                        whileHover={{
                          scale: 1.2,
                          rotate: 10,
                          transition: { type: "tween", duration: 0.08, ease: "linear" }
                        }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <div className={styles.socialIcon}>
                          <Image
                            src={social.icon}
                            alt={social.alt}
                            fill
                          />
                        </div>
                      </motion.a>
                    ))}
                  </div>
                </motion.div>
              </>
            ) : (
              <>
                {/* Name Text - Exact Positioning */}
                <motion.h1
                  className={styles.heroName}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.7 }}
                  transition={{ duration: 0.7, delay: 0.2 }}
                >
                  <span className={styles.lastName}>
                    <span className={styles.rotatingStar}>*</span>Alimi
                  </span>
                  <span className={styles.firstName}>Ahmed Baha Eddine</span>
                </motion.h1>
                {/* Subtitle Text */}
                <motion.p
                  className={styles.heroTitle}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.7 }}
                  transition={{ duration: 0.7, delay: 0.3 }}
                >
                  Comp Sci Student
                </motion.p>
                <motion.p
                  className={styles.heroSubtitle}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.7 }}
                  transition={{ duration: 0.7, delay: 0.4 }}
                >
                  At Innopolis University
                </motion.p>
                {/* Profile Image */}
                <motion.div
                  className={styles.heroImageContainer}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, amount: 0.7 }}
                  transition={{ duration: 0.7, delay: 0.5 }}
                >
                  <Image
                    src={getImagePath("/images/profile-photo.png")}
                    alt="Ahmed Baha Eddine Alimi"
                    width={500}
                    height={500}
                    className={styles.profileImage}
                    priority
                  />
                </motion.div>
                {/* Social Links Container */}
                <motion.div
                  className={styles.socialLinksContainer}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.7 }}
                  transition={{ duration: 0.7, delay: 0.6 }}
                >
                  <div className={styles.socialLinks}>
                    {[
                      { href: "#", platform: "upwork", icon: getImagePath("/icons/upwork.svg"), alt: "Upwork" },
                      { href: "https://t.me/Allimi3", platform: "telegram", icon: getImagePath("/icons/telegram.svg"), alt: "Telegram" },
                      { href: "https://www.behance.net/bahaallimi1", platform: "behance", icon: getImagePath("/icons/behance.svg"), alt: "Behance" },
                      { href: "https://github.com/3llimi", platform: "github", icon: getImagePath("/icons/github.svg"), alt: "GitHub" },
                      { href: "https://www.linkedin.com/in/ahmed-baha-eddine-alimi/", platform: "linkedin", icon: getImagePath("/icons/linkedin.svg"), alt: "LinkedIn" },
                      { href: "https://www.instagram.com/3llimi/", platform: "instagram", icon: getImagePath("/icons/instagram.svg"), alt: "Instagram" }
                    ].map((social, index) => (
                      <motion.a
                        key={social.platform}
                        href={social.href}
                        className={styles.socialLink}
                        data-platform={social.platform}
                        aria-label={social.alt}
                        initial={{ opacity: 0, scale: 0, rotate: -180 }}
                        whileInView={{
                          opacity: 1,
                          scale: 1,
                          rotate: 0,
                          transition: {
                            duration: 0.6,
                            delay: 0.8 + index * 0.1,
                            type: "spring",
                            stiffness: 200,
                            damping: 15
                          }
                        }}
                        viewport={{ once: true, amount: 0.7 }}
                        whileHover={{
                          scale: 1.2,
                          rotate: 10,
                          transition: { type: "tween", duration: 0.08, ease: "linear" }
                        }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <div className={styles.socialIcon}>
                          <Image
                            src={social.icon}
                            alt={social.alt}
                            fill
                          />
                        </div>
                      </motion.a>
                    ))}
                  </div>
                </motion.div>
                {/* Caption (desktop only) */}
                <motion.div
                  className={styles.heroCaption}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.7 }}
                  transition={{ duration: 0.7, delay: 0.7 }}
                >
                  Shot in Innopolis University&apos;s Robotics Lab: By Me
                </motion.div>
              </>
            )}
          </div>
        </motion.section>

        {/* About Me Section */}
        <motion.section
          className={styles.aboutSection}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className={styles.aboutContainer}>
            {/* Left Side - Title */}
            <motion.div
              className={styles.aboutTitle}
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.7 }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              <h2>ABOUT ME</h2>
            </motion.div>

            {/* Right Side - Content */}
            <motion.div
              className={styles.aboutContent}
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.7 }}
              transition={{ duration: 0.7, delay: 0.3 }}
            >
              {/* Top Quote Mark */}
              <div className={styles.quoteTop}>&ldquo;</div>

              {/* Main Content */}
              <div className={styles.aboutText}>
                <h3 className={styles.aboutIntro}>
                  I am <strong>Ahmed Baha Eddine</strong>. You can call me <em>Baha</em> for short.
                </h3>

                <h4 className={styles.aboutLocation}>
                  A Tunisian Computer Science Student Currently Based in <span className={styles.russiaText}><span className={styles.russiaRu}>Ru</span><span className={styles.russiaS}>ss</span><span className={styles.russiaIa}>ia</span></span>
                </h4>

                <div className={styles.aboutDescription}>
                  <p>
                    I have a passion for anything related to computers, I have been very active through the years of my high school in my
                    country Tunisia, Participated and numerous hackathons and competitions.
                  </p>

                  <p>
                    I have acquired a number of skills throughout these years along with opening in some other interests and fields such
                    as film making and photography
                  </p>
                </div>
              </div>

              {/* Bottom Quote Mark */}
              <div className={styles.quoteBottom}>&rdquo;</div>
            </motion.div>
          </div>
        </motion.section>

        {/* Skills & Technologies Section */}
        <motion.section
          ref={skillsSectionRef}
          className={styles.skillsSection}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {isMobile ? (
            <div className={styles.skillsTitleBlock + ' ' + styles.skillsTitleBlockMobile}>
              <div className={styles.skillsTitleMain}>SKILLS</div>
              <div className={styles.skillsTitleSub}>TECHNOLOGIES</div>
            </div>
          ) : null}
          <div className={styles.skillsScrollContainer}>
            {hasMounted && (
              <div
                className={styles.skillsVerticalCarousel}
                ref={skillsMarqueeViewportRef}
                tabIndex={0}
                onMouseEnter={() => setIsSkillsHovered(true)}
                onMouseLeave={() => setIsSkillsHovered(false)}
                onFocus={() => setIsSkillsHovered(true)}
                onBlur={() => setIsSkillsHovered(false)}
                onTouchStart={handleSkillsTouchStart}
                onTouchMove={handleSkillsTouchMove}
                onTouchEnd={handleSkillsTouchEnd}
                onTouchCancel={handleSkillsTouchEnd}
              >
                <div ref={skillsMarqueeTrackRef} className={styles.skillsVerticalMarqueeTrack}>
                  {renderSkillGroups("base")}
                  {renderSkillGroups("clone")}
                </div>
              </div>
            )}
          </div>
          <div className={styles.skillsHeadingRight}>
            {!isMobile && (
              <div className={styles.skillsTitleBlock}>
                <div className={styles.skillsTitleMain}>{/* paProjects style */}SKILLS</div>
                <div className={styles.skillsTitleSub}>{/* paAchievements style */}TECHNOLOGIES</div>
              </div>
            )}
          </div>
        </motion.section>

        {/* Projects & Achievements Section - Screenshot Match */}
        <motion.section
          className={styles.projectsAchievementsSection}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className={styles.paColumns2}>
            {/* Left: Titles */}
            <motion.div
              className={styles.paLeft2}
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.7 }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              <div className={styles.paProjects}>PROJECTS</div>
              <div className={styles.paAmp}>&</div>
              <div className={styles.paAchievements}>ACHIEVEMENTS</div>
            </motion.div>
            {/* Center: Project Blocks Vertical Scrollable */}
            <motion.div
              className={styles.paCenter2}
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.7 }}
              transition={{ duration: 0.7, delay: 0.3 }}
            >
              {hasMounted && (
                <div
                  className={styles.verticalCarousel}
                  ref={projectsCarouselViewportRef}
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
                        className={styles.paBlock}
                        key={`${item.title}-${item.rightLabel}-${idx}`}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.7 }}
                        transition={{ duration: 0.6, delay: (idx % paData.length) * 0.08 }}
                      >
                        <div className={styles.paTitleRow}>
                          <div className={styles.paMainTitle + (item.scholarship ? ' ' + styles.paScholarshipTitle : '')}>
                            {item.title}
                          </div>
                          <div className={styles.paRightLabel}>{item.rightLabel}</div>
                        </div>
                        <div className={styles.paSubtitle}>{item.subtitle}</div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </motion.section>

        {/* GitHub Projects Section */}
        <motion.section
          className={styles.githubProjectsSection}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className={styles.githubProjectsInner}>
            <motion.h2
              className={styles.githubProjectsTitle}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.7 }}
              transition={{ duration: 0.6 }}
            >
              GITHUB PROJECTS
            </motion.h2>

            <motion.p
              className={styles.githubProjectsSubtitle}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.7 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              Some selected repositories that I am proud of doing with a visual preview and quick context.
            </motion.p>

            <div
              ref={githubCarouselViewportRef}
              className={styles.githubCarouselViewport}
              tabIndex={0}
              onMouseEnter={() => setIsGitHubCarouselPaused(true)}
              onMouseLeave={() => setIsGitHubCarouselPaused(false)}
              onFocus={() => setIsGitHubCarouselPaused(true)}
              onBlur={() => setIsGitHubCarouselPaused(false)}
              onTouchStart={handleGitHubTouchStart}
              onTouchMove={handleGitHubTouchMove}
              onTouchEnd={handleGitHubTouchEnd}
              onTouchCancel={handleGitHubTouchEnd}
            >
              <div ref={githubCarouselTrackRef} className={styles.githubCarouselTrack}>
                {marqueeGithubProjects.map((project, index) => (
                  <motion.article
                    key={`${project.id}-${index}`}
                    className={styles.githubProjectCard}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.35 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                  >
                    <div className={styles.githubProjectCoverWrap}>
                      <Image
                        src={getImagePath(project.cover)}
                        alt={`${project.title} cover`}
                        width={900}
                        height={520}
                        className={styles.githubProjectCover}
                      />
                    </div>

                    <div className={styles.githubProjectContent}>
                      <h3 className={styles.githubProjectTitle}>{project.title}</h3>
                      <p className={styles.githubProjectDescription}>{project.description}</p>
                      <div className={styles.githubProjectActions}>
                        <div className={styles.githubProjectPrimaryActions}>
                          {project.contributionRole && (
                            <button
                              type="button"
                              className={styles.githubProjectReadmeButton}
                              onClick={() => handleContributionClick(project)}
                            >
                              View Contribution
                            </button>
                          )}
                          <button
                            type="button"
                            className={styles.githubProjectReadmeButton}
                            onClick={() => handleReadmeClick(project)}
                          >
                            Read README
                          </button>
                        </div>
                        <a
                          href={project.repoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.githubProjectLink}
                        >
                          View Repository
                        </a>
                      </div>
                    </div>
                  </motion.article>
                ))}
              </div>
            </div>

          </div>
        </motion.section>

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
                initial={{ opacity: 0, y: 24, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.98 }}
                transition={{ duration: 0.24, ease: "easeOut" }}
              >
              <div className={styles.githubReadmeHeader}>
                <h3 className={styles.githubReadmeTitle}>{readmeTitle} README</h3>
                <div className={styles.githubReadmeHeaderActions}>
                  {readmeRepoUrl && (
                    <a
                      href={readmeRepoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.githubReadmeRepoLink}
                    >
                      Open Repo
                    </a>
                  )}
                  <button
                    type="button"
                    className={styles.githubReadmeClose}
                    onClick={closeReadmeOverlay}
                  >
                    Close
                  </button>
                </div>
              </div>

              {isReadmeLoading && <p className={styles.githubReadmeMeta}>Loading README...</p>}
              {!isReadmeLoading && readmeError && (
                <p className={styles.githubReadmeMeta}>{readmeError}</p>
              )}
              {!isReadmeLoading && !readmeError && readmeContent && (
                <div className={styles.githubReadmeContent}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={readmeHeadingComponents}>
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
                initial={{ opacity: 0, y: 24, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.98 }}
                transition={{ duration: 0.24, ease: "easeOut" }}
              >
                <div className={styles.githubReadmeHeader}>
                  <h3 className={styles.githubReadmeTitle}>
                    {activeContribution.title} Contribution &amp; Role
                  </h3>
                  <div className={styles.githubReadmeHeaderActions}>
                    <button
                      type="button"
                      className={styles.githubReadmeClose}
                      onClick={closeContributionOverlay}
                    >
                      Close
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
        <motion.footer
          className={styles.footer}
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, delay: 0.2, type: "spring", stiffness: 100 }}
        >
          <div className={styles.footerContent}>
            <motion.h3
              className={styles.contactTitle}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.7 }}
              transition={{
                duration: 0.6,
                delay: 0.4,
                type: "spring",
                stiffness: 200,
                damping: 15
              }}
            >
              GET IN TOUCH
            </motion.h3>
            <motion.p
              className={styles.copyright}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.7 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              © 2024 Designed and Developed by Ahmed Baha Eddine Alimi
            </motion.p>
          </div>
        </motion.footer>

        {/* Navigation Bubbles */}
        {hasMounted && (
          <>
            {!atBottom && (
              <motion.div
                className={`${styles.navigationBubble} ${styles.navigationBubbleDown} ${skillsActive ? styles.bubbleSkillsActive : ''}`}
                onClick={scrollToNextSection}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 1.5, type: "spring", stiffness: 200 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className={`${styles.chevron} ${styles.chevronDown}`}></div>
              </motion.div>
            )}

            {!atTop && (
              <motion.div
                className={`${styles.navigationBubble} ${styles.navigationBubbleUp} ${skillsActive ? styles.bubbleSkillsActive : ''}`}
                onClick={scrollToPreviousSection}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 1.7, type: "spring", stiffness: 200 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className={`${styles.chevron} ${styles.chevronUp}`}></div>
              </motion.div>
            )}
          </>
        )}
      </div>
    </>
  );
}
