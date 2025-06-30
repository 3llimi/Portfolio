"use client";
import Image from "next/image";
import styles from "./page.module.css";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

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
  ];

  // Custom cursor state
  const [cursor, setCursor] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const move = (e: MouseEvent) => {
      setCursor({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);

  return (
    <>
      {/* Custom Cursor */}
      <div
        className="custom-cursor-invert"
        style={{
          left: `${cursor.x}px`,
          top: `${cursor.y}px`,
        }}
      />
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
              src="/images/hero-bg.jpg"
              alt="Hero background"
              fill
              className={styles.heroImage}
              priority
            />
            <div className={styles.heroOverlay}></div>
          </div>
          {/* Content Container */}
          <div className={styles.heroContent}>
            {/* Name Text - Exact Positioning */}
            <motion.h1
              className={styles.heroName}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.7 }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              <span className={styles.lastName}>Alimi</span>
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
                src="/images/profile-photo.png"
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
                <a
                  href="#"
                  className={styles.socialLink}
                  data-platform="upwork"
                  aria-label="Upwork"
                >
                  <div className={styles.socialIcon}>
                    <Image
                      src="/icons/upwork.svg"
                      alt="Upwork"
                      width={25}
                      height={15}
                    />
                  </div>
                </a>

                <a
                  href="#"
                  className={styles.socialLink}
                  data-platform="telegram"
                  aria-label="Telegram"
                >
                  <div className={styles.socialIcon}>
                    <Image
                      src="/icons/telegram.svg"
                      alt="Telegram"
                      width={25}
                      height={25}
                    />
                  </div>
                </a>

                <a
                  href="https://www.behance.net/bahaallimi1"
                  className={styles.socialLink}
                  data-platform="behance"
                  aria-label="Behance"
                >
                  <div className={styles.socialIcon}>
                    <Image
                      src="/icons/behance.svg"
                      alt="Behance"
                      width={25}
                      height={16}
                    />
                  </div>
                </a>

                <a
                  href="https://github.com/3llimi"
                  className={styles.socialLink}
                  data-platform="github"
                  aria-label="GitHub"
                >
                  <div className={styles.socialIcon}>
                    <Image
                      src="/icons/github.svg"
                      alt="GitHub"
                      width={25}
                      height={25}
                    />
                  </div>
                </a>

                <a
                  href="https://www.linkedin.com/in/ahmed-baha-eddine-alimi/"
                  className={styles.socialLink}
                  data-platform="linkedin"
                  aria-label="LinkedIn"
                >
                  <div className={styles.socialIcon}>
                    <Image
                      src="/icons/linkedin.svg"
                      alt="LinkedIn"
                      width={25}
                      height={25}
                    />
                  </div>
                </a>

                <a
                  href="https://www.instagram.com/3llimi/"
                  className={styles.socialLink}
                  data-platform="instagram"
                  aria-label="Instagram"
                >
                  <div className={styles.socialIcon}>
                    <Image
                      src="/icons/instagram.svg"
                      alt="Instagram"
                      width={25}
                      height={25}
                    />
                  </div>
                </a>
              </div>
            </motion.div>
            {/* Caption */}
            <motion.div
              className={styles.heroCaption}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.7 }}
              transition={{ duration: 0.7, delay: 0.7 }}
            >
              Shot in Innopolis University&apos;s Robotics Lab: By Me
            </motion.div>
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
                  A Tunisian Computer Science Student Currently Based in Russia
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
          className={styles.skillsSection}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className={styles.skillsScrollContainer}>
            <div className={styles.skillsGroups}>
              {/* UI/UX Design Group */}
              <motion.div
                className={styles.skillGroup}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.7 }}
                transition={{ duration: 0.7, delay: 0.2 }}
              >
                <h3 className={styles.groupTitle}>*UI/UX Design</h3>
                <div className={styles.skillsRow}>
                  <div className={styles.skillItem}>
                    <div className={styles.skillIconLarge}>
                      <Image src="/icons/figma.svg" alt="Figma" width={40} height={40} />
                    </div>
                    <span className={styles.skillLabel}>*Figma</span>
                  </div>
                </div>
              </motion.div>

              {/* Front-End Development Group */}
              <motion.div
                className={styles.skillGroup}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.7 }}
                transition={{ duration: 0.7, delay: 0.3 }}
              >
                <h3 className={styles.groupTitle}>*Front-End Development</h3>
                <div className={styles.skillsRow}>
                  <div className={styles.skillItem}>
                    <div className={styles.skillIconLarge}>
                      <Image src="/icons/html5.svg" alt="HTML5" width={40} height={40} />
                    </div>
                    <span className={styles.skillLabel}>*HTML5</span>
                  </div>
                  <div className={styles.skillItem}>
                    <div className={styles.skillIconLarge}>
                      <Image src="/icons/css3.svg" alt="CSS3" width={40} height={40} />
                    </div>
                    <span className={styles.skillLabel}>*CSS3</span>
                  </div>
                  <div className={styles.skillItem}>
                    <div className={styles.skillIconLarge}>
                      <Image src="/icons/javascript.svg" alt="JavaScript" width={40} height={40} />
                    </div>
                    <span className={styles.skillLabel}>*JavaScript</span>
                  </div>
                  <div className={styles.skillItem}>
                    <div className={styles.skillIconLarge}>
                      <Image src="/icons/typescript.svg" alt="TypeScript" width={40} height={40} />
                    </div>
                    <span className={styles.skillLabel}>*TypeScript</span>
                  </div>
                  <div className={styles.skillItem}>
                    <div className={styles.skillIconLarge}>
                      <Image src="/icons/angular.svg" alt="Angular" width={40} height={40} />
                    </div>
                    <span className={styles.skillLabel}>*Angular</span>
                  </div>
                  <div className={styles.skillItem}>
                    <div className={styles.skillIconLarge}>
                      <Image src="/icons/flutter.svg" alt="flutter" width={40} height={40} />
                    </div>
                    <span className={styles.skillLabel}>*Flutter</span>
                  </div>
                </div>
              </motion.div>

              {/* Back-End Development Group */}
              <motion.div
                className={styles.skillGroup}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.7 }}
                transition={{ duration: 0.7, delay: 0.4 }}
              >
                <h3 className={styles.groupTitle}>*Back-End Development</h3>
                <div className={styles.skillsRow}>
                  <div className={styles.skillItem}>
                    <div className={styles.skillIconLarge}>
                      <Image src="/icons/nodejs.svg" alt="Node.js" width={40} height={40} />
                    </div>
                    <span className={styles.skillLabel}>*Node.js</span>
                  </div>
                  <div className={styles.skillItem}>
                    <div className={styles.skillIconLarge}>
                      <Image src="/icons/postgresql.svg" alt="PostgreSQL" width={40} height={40} />
                    </div>
                    <span className={styles.skillLabel}>*PostgreSQL</span>
                  </div>
                  <div className={styles.skillItem}>
                    <div className={styles.skillIconLarge}>
                      <Image src="/icons/mongodb.svg" alt="MongoDB" width={40} height={40} />
                    </div>
                    <span className={styles.skillLabel}>*MongoDB</span>
                  </div>
                  <div className={styles.skillItem}>
                    <div className={styles.skillIconLarge}>
                      <Image src="/icons/mysql.svg" alt="MySQL" width={40} height={40} />
                    </div>
                    <span className={styles.skillLabel}>*MySQL</span>
                  </div>
                  <div className={styles.skillItem}>
                    <div className={styles.skillIconLarge}>
                      <Image src="/icons/php.svg" alt="PHP" width={40} height={40} />
                    </div>
                    <span className={styles.skillLabel}>*PHP</span>
                  </div>
                  <div className={styles.skillItem}>
                    <div className={styles.skillIconLarge}>
                      <Image src="/icons/docker.svg" alt="Docker" width={40} height={40} />
                    </div>
                    <span className={styles.skillLabel}>*Docker</span>
                  </div>
                  <div className={styles.skillItem}>
                    <div className={styles.skillIconLarge}>
                      <Image src="/icons/go.svg" alt="Go" width={40} height={40} />
                    </div>
                    <span className={styles.skillLabel}>*GoLang</span>
                  </div>
                </div>
              </motion.div>

              {/* Programming Group */}
              <motion.div
                className={styles.skillGroup}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.7 }}
                transition={{ duration: 0.7, delay: 0.5 }}
              >
                <h3 className={styles.groupTitle}>*Programming</h3>
                <div className={styles.skillsRow}>
                  <div className={styles.skillItem}>
                    <div className={styles.skillIconLarge}>
                      <Image src="/icons/python.svg" alt="Python" width={40} height={40} />
                    </div>
                    <span className={styles.skillLabel}>*Python</span>
                  </div>
                  <div className={styles.skillItem}>
                    <div className={styles.skillIconLarge}>
                      <Image src="/icons/csharp.svg" alt="C#" width={40} height={40} />
                    </div>
                    <span className={styles.skillLabel}>*C#</span>
                  </div>
                  <div className={styles.skillItem}>
                    <div className={styles.skillIconLarge}>
                      <Image src="/icons/cpp.svg" alt="C++" width={40} height={40} />
                    </div>
                    <span className={styles.skillLabel}>*C++</span>
                  </div>
                  <div className={styles.skillItem}>
                    <div className={styles.skillIconLarge}>
                      <Image src="/icons/c.svg" alt="C" width={40} height={40} />
                    </div>
                    <span className={styles.skillLabel}>*C</span>
                  </div>
                  <div className={styles.skillItem}>
                    <div className={styles.skillIconLarge}>
                      <Image src="/icons/java.svg" alt="Java" width={40} height={40} />
                    </div>
                    <span className={styles.skillLabel}>*Java</span>
                  </div>
                  <div className={styles.skillItem}>
                    <div className={styles.skillIconLarge}>
                      <Image src="/icons/arduino.svg" alt="Arduino" width={40} height={40} />
                    </div>
                    <span className={styles.skillLabel}>*Arduino</span>
                  </div>
                </div>
              </motion.div>

              {/* Photography Group */}
              <motion.div
                className={styles.skillGroup}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.7 }}
                transition={{ duration: 0.7, delay: 0.6 }}
              >
                <h3 className={styles.groupTitle}>*Photography</h3>
                <div className={styles.skillsRow}>
                  <div className={styles.skillItem}>
                    <div className={styles.skillIconLarge}>
                      <Image src="/icons/lightroom.svg" alt="Lightroom" width={40} height={40} />
                    </div>
                    <span className={styles.skillLabel}>*Lightroom</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
          <div className={styles.skillsHeadingRight}>
            <div className={styles.skillsTitleBlock}>
              <div className={styles.skillsTitleMain}>{/* paProjects style */}SKILLS</div>
              <div className={styles.skillsTitleSub}>{/* paAchievements style */}TECHNOLOGIES</div>
            </div>
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
              <div className={styles.verticalCarousel}>
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
            </motion.div>
          </div>
        </motion.section>

        {/* Footer */}
        <footer className={styles.footer}>
          <div className={styles.footerContent}>
            <h3 className={styles.contactTitle}>GET IN TOUCH</h3>
            <p className={styles.copyright}>© 2024 Designed and Developed by Ahmed Baha Eddine Alimi</p>
          </div>
        </footer>
      </div>
    </>
  );
}
