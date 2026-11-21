// Skills shown in the "Skills & Technologies" section, and where each one was used.
// Project evidence comes from the repositories on github.com/3llimi.

const GH = "https://github.com/3llimi";

export type ProjectKind = "Personal" | "Team project" | "Team lead" | "Course project" | "Course labs";

export type Project = {
  name: string;
  year: number;
  kind: ProjectKind;
  url: string;
};

export const PROJECTS = {
  portfolio: { name: "Portfolio Site", year: 2026, kind: "Personal", url: `${GH}/Portfolio` },
  bookTracker: { name: "Book Tracker", year: 2026, kind: "Course project", url: `${GH}/BookTrackerApp-SQRS-S26` },
  devops: { name: "DevOps Core Course", year: 2026, kind: "Course labs", url: `${GH}/DevOps-Core-Course` },
  devsecops: { name: "DevSecOps Labs", year: 2026, kind: "Course labs", url: `${GH}/DevSecOps-Intro` },
  accpa: { name: "ACCPA: STELLA Type Checker", year: 2026, kind: "Course project", url: `${GH}/ACCPA` },
  compilers: { name: "Project D Interpreter", year: 2025, kind: "Course project", url: `${GH}/Compilers-Construction-Course-F25` },
  innosyncCapstone: { name: "InnoSync Platform", year: 2025, kind: "Team lead", url: `${GH}/InnoSync-Capstone-Sum25` },
  innosyncMobile: { name: "InnoSync Mobile", year: 2025, kind: "Team project", url: `${GH}/InnoSync-Mobile-App` },
  innocivic: { name: "InnoCivic", year: 2025, kind: "Team project", url: `${GH}/InnoCivic` },
  threathound: { name: "ThreatHound", year: 2025, kind: "Team project", url: `${GH}/ThreatHound` },
  goFlutter: { name: "Go + Flutter Course", year: 2025, kind: "Course labs", url: `${GH}/sum25-go-flutter-course` },
  databases: { name: "Databases Course", year: 2025, kind: "Course labs", url: `${GH}/Databases-Course-S25` },
  dnpLabs: { name: "Distributed Systems Labs", year: 2025, kind: "Course labs", url: `${GH}/DNP-Course-S25` },
  dnpProject: { name: "Networked Tic-Tac-Toe", year: 2025, kind: "Course project", url: `${GH}/DNP-S25-Project` },
  iml: { name: "Machine Learning Course", year: 2025, kind: "Course labs", url: `${GH}/IML-Course-S25` },
  gptitor: { name: "GPTitor", year: 2024, kind: "Team project", url: `${GH}/GPTitorSWP` },
  washmate: { name: "WashMate", year: 2024, kind: "Course project", url: `${GH}/Front-End-Web-Development-Project-WashMate-` },
  svelteFolio: { name: "First Portfolio (SvelteKit)", year: 2024, kind: "Course project", url: `${GH}/MyPortfolio` },
  optimization: { name: "Intro to Optimization", year: 2024, kind: "Course labs", url: `${GH}/Introduction-to-Optimization` },
  dsa: { name: "Data Structures & Algorithms", year: 2024, kind: "Course labs", url: `${GH}/Data-Structures-and-Algorithms` },
  designPatterns: { name: "Design Patterns", year: 2024, kind: "Course labs", url: `${GH}/Design-Patterns` },
  agla: { name: "Linear Algebra Exercises", year: 2024, kind: "Course labs", url: `${GH}/AGLA-2-Coding-Exs` },
  cAssignments: { name: "Intro to Programming", year: 2024, kind: "Course labs", url: `${GH}/C-assignments` },
  javaUml: { name: "Java UML Exercises", year: 2024, kind: "Course labs", url: `${GH}/Java-UML-exercises` },
} satisfies Record<string, Project>;

export type ProjectId = keyof typeof PROJECTS;

export type SkillUse = { project: ProjectId; note: string };

export type Skill = { icon: string; label: string; uses: SkillUse[] };

export type SkillGroup = {
  id: string;
  filterLabel: string;
  title: string;
  blurb: string;
  wide?: boolean;
  items: Skill[];
};

export const GITHUB_PROFILE = GH;

export const SKILL_GROUPS: SkillGroup[] = [
  {
    id: "frontend",
    filterLabel: "Front-End",
    title: "Front-End Development",
    blurb: "Responsive, accessible interfaces for web and mobile.",
    items: [
      {
        icon: "/icons/html5.svg",
        label: "HTML5",
        uses: [
          { project: "portfolio", note: "Semantic, accessible page structure for this site." },
          { project: "washmate", note: "Booking and account pages for a laundry-scheduling web app." },
          { project: "svelteFolio", note: "Hand-written markup for my first portfolio in SvelteKit." },
        ],
      },
      {
        icon: "/icons/css3.svg",
        label: "CSS3",
        uses: [
          { project: "portfolio", note: "CSS Modules, keyframe animations and fluid responsive layouts." },
          { project: "gptitor", note: "Custom CSS for an accessible, chat-style learning interface." },
          { project: "innocivic", note: "Tailwind CSS for dataset browsing and visualisation views." },
          { project: "washmate", note: "Tailwind CSS styling across the app." },
        ],
      },
      {
        icon: "/icons/javascript.svg",
        label: "JavaScript",
        uses: [
          { project: "gptitor", note: "React front end with a Jest and Babel test setup." },
          { project: "innocivic", note: "Vite, Tailwind and ESLint tooling around a React app." },
        ],
      },
      {
        icon: "/icons/typescript.svg",
        label: "TypeScript",
        uses: [
          { project: "portfolio", note: "Next.js + Framer Motion, with a live GitHub API integration." },
          { project: "devops", note: "Cloudflare Workers edge API, tested with Vitest." },
          { project: "innosyncCapstone", note: "Led the Next.js + React web front end." },
          { project: "innocivic", note: "React with TanStack Query/Table, Zustand and Zod." },
          { project: "gptitor", note: "React + Vite components for tasks, scoring and profiles." },
        ],
      },
      { icon: "/icons/angular.svg", label: "Angular", uses: [] },
      {
        icon: "/icons/flutter.svg",
        label: "Flutter",
        uses: [
          { project: "goFlutter", note: "Lab apps covering UI, state management, API calls and tests." },
          { project: "innosyncMobile", note: "Team-built mobile client, connected to the Go API I wrote." },
        ],
      },
    ],
  },
  {
    id: "backend",
    filterLabel: "Back-End",
    title: "Back-End Development",
    blurb: "APIs, services and the data layers behind them.",
    items: [
      {
        icon: "/icons/nodejs.svg",
        label: "Node.js",
        uses: [
          { project: "portfolio", note: "Node-based Next.js build and static export to GitHub Pages." },
          { project: "innosyncCapstone", note: "Next.js web app tooling and deployment scripts." },
          { project: "washmate", note: "Next.js app backed by Firebase." },
        ],
      },
      {
        icon: "/icons/go.svg",
        label: "GoLang",
        uses: [
          { project: "innosyncMobile", note: "REST API with Gin and GORM, documented with Swagger." },
          { project: "devops", note: "Go version of the info service, containerised and deployed to Kubernetes." },
          { project: "goFlutter", note: "Go back-end labs with automated tests and CI." },
        ],
      },
      { icon: "/icons/php.svg", label: "PHP", uses: [] },
      {
        icon: "/icons/postgresql.svg",
        label: "PostgreSQL",
        uses: [
          { project: "bookTracker", note: "Production database on Neon Postgres, SQLite locally." },
          { project: "innosyncMobile", note: "Designed the schema; Postgres 16 runs in Docker Compose." },
          { project: "innosyncCapstone", note: "Relational store behind the web platform." },
          { project: "databases", note: "SQL assignments and labs using psycopg2." },
        ],
      },
      {
        icon: "/icons/mongodb.svg",
        label: "MongoDB",
        uses: [{ project: "databases", note: "Document modelling and aggregation queries with PyMongo." }],
      },
      { icon: "/icons/mysql.svg", label: "MySQL", uses: [] },
      {
        icon: "/icons/docker.svg",
        label: "Docker",
        uses: [
          { project: "devops", note: "Multi-stage images for Python and Go apps; Compose for the monitoring stack." },
          { project: "devsecops", note: "Image scanning with Trivy and container hardening." },
          { project: "bookTracker", note: "Dockerfile and Compose setup for the API and UI." },
          { project: "accpa", note: "Containerised type checker for automated testing." },
          { project: "threathound", note: "Containerised the full Wazuh + ELK + Trivy platform." },
          { project: "innosyncMobile", note: "Compose for the Go API and Postgres." },
        ],
      },
    ],
  },
  {
    id: "devops",
    filterLabel: "DevOps",
    title: "DevOps",
    blurb: "Infrastructure as code, delivery pipelines and observability.",
    items: [
      {
        icon: "/icons/kubernetes.svg",
        label: "Kubernetes",
        uses: [
          { project: "devops", note: "Deployments, Services, Ingress, ConfigMaps, Secrets and StatefulSets." },
          { project: "devsecops", note: "Deployment hardening and policy checks with Conftest." },
        ],
      },
      {
        icon: "/icons/terraform.svg",
        label: "Terraform",
        uses: [
          { project: "devops", note: "GitHub repository settings managed as code, plus the same setup in Pulumi." },
          { project: "devsecops", note: "IaC security scanning with Checkov, KICS and Terrascan." },
        ],
      },
      {
        icon: "/icons/ansible.svg",
        label: "Ansible",
        uses: [
          { project: "devops", note: "Roles and playbooks to provision servers and deploy the app." },
          { project: "devsecops", note: "Scanned playbooks for misconfigurations with KICS." },
        ],
      },
      {
        icon: "/icons/helm.svg",
        label: "Helm",
        uses: [{ project: "devops", note: "Own chart with dev/prod values and a shared library chart; Vault via Helm." }],
      },
      {
        icon: "/icons/argo-cd.svg",
        label: "Argo CD",
        uses: [{ project: "devops", note: "GitOps delivery with an Application and ApplicationSet per environment." }],
      },
      {
        icon: "/icons/prometheus.svg",
        label: "Prometheus",
        uses: [{ project: "devops", note: "Scraped app metrics and added a ServiceMonitor in Kubernetes." }],
      },
      {
        icon: "/icons/grafana.svg",
        label: "Grafana",
        uses: [{ project: "devops", note: "Dashboards combining Prometheus metrics with Loki/Promtail logs." }],
      },
    ],
  },
  {
    id: "languages",
    filterLabel: "Languages",
    title: "Programming",
    blurb: "From systems programming to scripting.",
    items: [
      {
        icon: "/icons/python.svg",
        label: "Python",
        uses: [
          { project: "bookTracker", note: "FastAPI + Streamlit app with tests and Locust load testing." },
          { project: "devops", note: "FastAPI info service with pytest, coverage and CI." },
          { project: "dnpLabs", note: "UDP Stop-and-Wait ARQ, a RabbitMQ pipeline and a gRPC game server." },
          { project: "dnpProject", note: "Multiplayer tic-tac-toe over sockets with threaded game rooms." },
          { project: "iml", note: "Machine-learning assignments in Jupyter notebooks." },
        ],
      },
      {
        icon: "/icons/rust.svg",
        label: "Rust",
        uses: [
          { project: "accpa", note: "Type checker for STELLA with type reconstruction and universal types." },
          { project: "compilers", note: "Interpreter for a dynamically typed language: lexer, parser and evaluator." },
        ],
      },
      {
        icon: "/icons/cpp.svg",
        label: "C++",
        uses: [
          { project: "optimization", note: "Simplex, interior-point and transportation-problem solvers." },
          { project: "dsa", note: "Graphs, trees, dynamic programming and more." },
          { project: "designPatterns", note: "Classic design patterns applied to assignments." },
          { project: "agla", note: "Matrix and linear algebra routines." },
        ],
      },
      {
        icon: "/icons/c.svg",
        label: "C",
        uses: [{ project: "cAssignments", note: "Intro to Programming assignments." }],
      },
      {
        icon: "/icons/java.svg",
        label: "Java",
        uses: [
          { project: "innosyncCapstone", note: "Spring Boot back end, which I reviewed as team lead." },
          { project: "dsa", note: "Binary search tree implementation." },
          { project: "javaUml", note: "UML diagrams turned into working code." },
        ],
      },
    ],
  },
  {
    id: "design",
    filterLabel: "Design",
    title: "UI/UX Design",
    blurb: "Wireframes, prototypes and design systems before the first line of code.",
    wide: true,
    items: [
      {
        icon: "/icons/figma.svg",
        label: "Figma",
        uses: [
          { project: "innosyncCapstone", note: "High-fidelity prototypes and one design system for web and mobile." },
          { project: "gptitor", note: "Led UI/UX: wireframes, user flows and a design system." },
        ],
      },
    ],
  },
];
