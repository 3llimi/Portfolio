"use client";
import Image from "next/image";
import styles from "./page.module.css";
import React, { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";

// Helper function to get the correct image path for GitHub Pages
const getImagePath = (path: string) => {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
  return `${basePath}${path}`;
};

export default function Home() {
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



  // Custom cursor state
  const [cursor, setCursor] = useState({ x: 0, y: 0 });
  const [showCursor, setShowCursor] = useState(true);

  // Helper to detect mobile
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 600;

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
    const move = (e: MouseEvent) => {
      setCursor({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, [showCursor]);

    // Navigation functions
  const scrollToNextSection = () => {
    const currentScrollY = window.scrollY;
    const windowHeight = window.innerHeight;
    const nextScrollPosition = currentScrollY + windowHeight;

    window.scrollTo({
      top: nextScrollPosition,
      behavior: 'smooth'
    });
  };

  const scrollToPreviousSection = () => {
    const currentScrollY = window.scrollY;
    const windowHeight = window.innerHeight;
    const prevScrollPosition = Math.max(0, currentScrollY - windowHeight);

    window.scrollTo({
      top: prevScrollPosition,
      behavior: 'smooth'
    });
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

  // Ref for auto-scroll in Projects section
  const projectsCarouselRef = useRef<HTMLDivElement | null>(null);
  const [isCarouselHovered, setIsCarouselHovered] = useState(false);

  useEffect(() => {
    const carousel = projectsCarouselRef.current;
    if (!carousel) return;
    let animationFrame: number | null = null;
    let lastTimestamp: number | null = null;
    const speed = 0.2; // px per ms (much faster, running effect)

    const step = (timestamp: number) => {
      if (isCarouselHovered) return;
      if (lastTimestamp === null) lastTimestamp = timestamp;
      const elapsed = timestamp - lastTimestamp;
      lastTimestamp = timestamp;
      // Scroll by speed * elapsed ms
      carousel.scrollTop += speed * elapsed;
      // If at or past bottom, scroll to top
      if (carousel.scrollTop + carousel.clientHeight >= carousel.scrollHeight - 1) {
        carousel.scrollTop = 0;
      }
      animationFrame = requestAnimationFrame(step);
    };

    if (!isCarouselHovered) {
      animationFrame = requestAnimationFrame(step);
    }
    return () => {
      if (animationFrame) cancelAnimationFrame(animationFrame);
      lastTimestamp = null;
    };
  }, [isCarouselHovered]);

  // Ref for auto-scroll in Skills section
  const skillsGroupsRef = useRef<HTMLDivElement | null>(null);
  const [isSkillsHovered, setIsSkillsHovered] = useState(false);

  useEffect(() => {
    const container = skillsGroupsRef.current;
    if (!container) return;
    let animationFrame: number | null = null;
    let lastTimestamp: number | null = null;
    const speed = 0.2; // px per ms (same as Projects)

    const step = (timestamp: number) => {
      if (isSkillsHovered) return;
      if (lastTimestamp === null) lastTimestamp = timestamp;
      const elapsed = timestamp - lastTimestamp;
      lastTimestamp = timestamp;
      container.scrollTop += speed * elapsed;
      if (container.scrollTop + container.clientHeight >= container.scrollHeight - 1) {
        container.scrollTop = 0;
      }
      animationFrame = requestAnimationFrame(step);
    };

    if (!isSkillsHovered) {
      animationFrame = requestAnimationFrame(step);
    }
    return () => {
      if (animationFrame) cancelAnimationFrame(animationFrame);
      lastTimestamp = null;
    };
  }, [isSkillsHovered]);

  // Hydration fix: only render browser-dependent UI after mount
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => { setHasMounted(true); }, []);

  return (
    <>
      {/* Custom Cursor */}
      {showCursor && (
        <div
          className="custom-cursor-invert"
          style={{
            left: `${cursor.x}px`,
            top: `${cursor.y}px`,
          }}
        />
      )}
      <div className={styles.portfolio}>
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
                        whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                        viewport={{ once: true, amount: 0.7 }}
                        transition={{
                          duration: 0.6,
                          delay: 0.8 + index * 0.1,
                          type: "spring",
                          stiffness: 200,
                          damping: 15
                        }}
                        whileHover={{
                          scale: 1.2,
                          rotate: 10,
                          transition: { duration: 0.2 }
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
                        whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                        viewport={{ once: true, amount: 0.7 }}
                        transition={{
                          duration: 0.6,
                          delay: 0.8 + index * 0.1,
                          type: "spring",
                          stiffness: 200,
                          damping: 15
                        }}
                        whileHover={{
                          scale: 1.2,
                          rotate: 10,
                          transition: { duration: 0.2 }
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
                ref={skillsGroupsRef}
                onMouseEnter={() => setIsSkillsHovered(true)}
                onMouseLeave={() => setIsSkillsHovered(false)}
                onTouchStart={() => setIsSkillsHovered(true)}
                onTouchEnd={() => setIsSkillsHovered(false)}
              >
                {/* UI/UX Design Group */}
                <motion.div
                  className={styles.skillGroup}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.7 }}
                  transition={{ duration: 0.8, delay: 0.2, type: "spring", stiffness: 100 }}
                >
                  <motion.h3
                    className={styles.groupTitle}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, amount: 0.7 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                  >
                    *UI/UX Design
                  </motion.h3>
                  <div className={styles.skillsRow}>
                    <motion.div
                      className={styles.skillItem}
                      initial={{ opacity: 0, scale: 0, rotateY: 90 }}
                      whileInView={{ opacity: 1, scale: 1, rotateY: 0 }}
                      viewport={{ once: true, amount: 0.7 }}
                      transition={{
                        duration: 0.6,
                        delay: 0.4,
                        type: "spring",
                        stiffness: 200,
                        damping: 15
                      }}
                      whileHover={{
                        rotateY: 10,
                        transition: { duration: 0.2 }
                      }}
                    >
                      <div className={styles.skillIconLarge}>
                        <Image src={getImagePath("/icons/figma.svg")} alt="Figma" width={40} height={40} />
                      </div>
                      <span className={styles.skillLabel}>*Figma</span>
                    </motion.div>
                  </div>
                </motion.div>

                {/* Front-End Development Group */}
                <motion.div
                  className={styles.skillGroup}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.7 }}
                  transition={{ duration: 0.8, delay: 0.3, type: "spring", stiffness: 100 }}
                >
                  <motion.h3
                    className={styles.groupTitle}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, amount: 0.7 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                  >
                    *Front-End Development
                  </motion.h3>
                  <div className={styles.skillsRow}>
                    {[
                      { icon: getImagePath("/icons/html5.svg"), alt: "HTML5", label: "*HTML5" },
                      { icon: getImagePath("/icons/css3.svg"), alt: "CSS3", label: "*CSS3" },
                      { icon: getImagePath("/icons/javascript.svg"), alt: "JavaScript", label: "*JavaScript" },
                      { icon: getImagePath("/icons/typescript.svg"), alt: "TypeScript", label: "*TypeScript" },
                      { icon: getImagePath("/icons/angular.svg"), alt: "Angular", label: "*Angular" },
                      { icon: getImagePath("/icons/flutter.svg"), alt: "flutter", label: "*Flutter" }
                    ].map((skill, index) => (
                      <motion.div
                        key={skill.alt}
                        className={styles.skillItem}
                        initial={{ opacity: 0, scale: 0, rotateY: 90 }}
                        whileInView={{ opacity: 1, scale: 1, rotateY: 0 }}
                        viewport={{ once: true, amount: 0.7 }}
                        transition={{
                          duration: 0.6,
                          delay: 0.5 + index * 0.1,
                          type: "spring",
                          stiffness: 200,
                          damping: 15
                        }}
                        whileHover={{
                          rotateY: 10,
                          transition: { duration: 0.2 }
                        }}
                      >
                        <div className={styles.skillIconLarge}>
                          <Image src={skill.icon} alt={skill.alt} width={40} height={40} />
                        </div>
                        <span className={styles.skillLabel}>{skill.label}</span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                {/* Back-End Development Group */}
                <motion.div
                  className={styles.skillGroup}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.7 }}
                  transition={{ duration: 0.8, delay: 0.4, type: "spring", stiffness: 100 }}
                >
                  <motion.h3
                    className={styles.groupTitle}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, amount: 0.7 }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                  >
                    *Back-End Development
                  </motion.h3>
                  <div className={styles.skillsRow}>
                    {[
                      { icon: getImagePath("/icons/nodejs.svg"), alt: "Node.js", label: "*Node.js" },
                      { icon: getImagePath("/icons/postgresql.svg"), alt: "PostgreSQL", label: "*PostgreSQL" },
                      { icon: getImagePath("/icons/mongodb.svg"), alt: "MongoDB", label: "*MongoDB" },
                      { icon: getImagePath("/icons/mysql.svg"), alt: "MySQL", label: "*MySQL" },
                      { icon: getImagePath("/icons/php.svg"), alt: "PHP", label: "*PHP" },
                      { icon: getImagePath("/icons/docker.svg"), alt: "Docker", label: "*Docker" },
                      { icon: getImagePath("/icons/go.svg"), alt: "Go", label: "*GoLang" }
                    ].map((skill, index) => (
                      <motion.div
                        key={skill.alt}
                        className={styles.skillItem}
                        initial={{ opacity: 0, scale: 0, rotateY: 90 }}
                        whileInView={{ opacity: 1, scale: 1, rotateY: 0 }}
                        viewport={{ once: true, amount: 0.7 }}
                        transition={{
                          duration: 0.6,
                          delay: 0.6 + index * 0.1,
                          type: "spring",
                          stiffness: 200,
                          damping: 15
                        }}
                        whileHover={{
                          rotateY: 10,
                          transition: { duration: 0.2 }
                        }}
                      >
                        <div className={styles.skillIconLarge}>
                          <Image src={skill.icon} alt={skill.alt} width={40} height={40} />
                        </div>
                        <span className={styles.skillLabel}>{skill.label}</span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                {/* Programming Group */}
                <motion.div
                  className={styles.skillGroup}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.7 }}
                  transition={{ duration: 0.8, delay: 0.5, type: "spring", stiffness: 100 }}
                >
                  <motion.h3
                    className={styles.groupTitle}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, amount: 0.7 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                  >
                    *Programming
                  </motion.h3>
                  <div className={styles.skillsRow}>
                    {[
                      { icon: getImagePath("/icons/python.svg"), alt: "Python", label: "*Python" },
                      { icon: getImagePath("/icons/csharp.svg"), alt: "C#", label: "*C#" },
                      { icon: getImagePath("/icons/cpp.svg"), alt: "C++", label: "*C++" },
                      { icon: getImagePath("/icons/c.svg"), alt: "C", label: "*C" },
                      { icon: getImagePath("/icons/java.svg"), alt: "Java", label: "*Java" },
                      { icon: getImagePath("/icons/arduino.svg"), alt: "Arduino", label: "*Arduino" }
                    ].map((skill, index) => (
                      <motion.div
                        key={skill.alt}
                        className={styles.skillItem}
                        initial={{ opacity: 0, scale: 0, rotateY: 90 }}
                        whileInView={{ opacity: 1, scale: 1, rotateY: 0 }}
                        viewport={{ once: true, amount: 0.7 }}
                        transition={{
                          duration: 0.6,
                          delay: 0.7 + index * 0.1,
                          type: "spring",
                          stiffness: 200,
                          damping: 15
                        }}
                        whileHover={{
                          rotateY: 10,
                          transition: { duration: 0.2 }
                        }}
                      >
                        <div className={styles.skillIconLarge}>
                          <Image src={skill.icon} alt={skill.alt} width={40} height={40} />
                        </div>
                        <span className={styles.skillLabel}>{skill.label}</span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                {/* Photography Group */}
                <motion.div
                  className={styles.skillGroup}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.7 }}
                  transition={{ duration: 0.8, delay: 0.6, type: "spring", stiffness: 100 }}
                >
                  <motion.h3
                    className={styles.groupTitle}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, amount: 0.7 }}
                    transition={{ duration: 0.6, delay: 0.7 }}
                  >
                    *Photography
                  </motion.h3>
                  <div className={styles.skillsRow}>
                    <motion.div
                      className={styles.skillItem}
                      initial={{ opacity: 0, scale: 0, rotateY: 90 }}
                      whileInView={{ opacity: 1, scale: 1, rotateY: 0 }}
                      viewport={{ once: true, amount: 0.7 }}
                      transition={{
                        duration: 0.6,
                        delay: 0.8,
                        type: "spring",
                        stiffness: 200,
                        damping: 15
                      }}
                      whileHover={{
                        rotateY: 10,
                        transition: { duration: 0.2 }
                      }}
                    >
                      <div className={styles.skillIconLarge}>
                        <Image src={getImagePath("/icons/lightroom.svg")} alt="Lightroom" width={40} height={40} />
                      </div>
                      <span className={styles.skillLabel}>*Lightroom</span>
                    </motion.div>
                  </div>
                </motion.div>
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
                  ref={projectsCarouselRef}
                  onMouseEnter={() => setIsCarouselHovered(true)}
                  onMouseLeave={() => setIsCarouselHovered(false)}
                  onTouchStart={() => setIsCarouselHovered(true)}
                  onTouchEnd={() => setIsCarouselHovered(false)}
                >
                  {paData.map((item, idx) => (
                    <motion.div
                      className={styles.paBlock}
                      key={idx}
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.7 }}
                      transition={{ duration: 0.6, delay: idx * 0.1 }}
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
              )}
            </motion.div>
          </div>
        </motion.section>

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
