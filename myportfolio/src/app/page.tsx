import Image from "next/image";
import styles from "./page.module.css";
import React from "react";

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

  return (
    <div className={styles.portfolio}>
      {/* Hero Section - Exact Figma Match */}
      <section className={styles.hero}>
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
          <h1 className={styles.heroName}>
            <span className={styles.lastName}>Alimi</span>
            <span className={styles.firstName}>Ahmed Baha Eddine</span>
          </h1>

          {/* Subtitle Text */}
          <p className={styles.heroTitle}>Comp Sci Student</p>
          <p className={styles.heroSubtitle}>At Innopolis University</p>

          {/* Profile Image */}
          <div className={styles.heroImageContainer}>
            <Image
              src="/images/profile-photo.png"
              alt="Ahmed Baha Eddine Alimi"
              width={500}
              height={500}
              className={styles.profileImage}
              priority
            />
          </div>

          {/* Social Links Container */}
          <div className={styles.socialLinksContainer}>
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
                href="#"
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
                href="#"
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
                href="#"
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
                href="#"
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
          </div>

          {/* Caption */}
          <div className={styles.heroCaption}>
            Shot in Innopolis University&apos;s Robotics Lab: By Me
          </div>
        </div>
      </section>

            {/* About Me Section */}
      <section className={styles.aboutSection}>
        <div className={styles.aboutContainer}>
          {/* Left Side - Title */}
          <div className={styles.aboutTitle}>
            <h2>ABOUT ME</h2>
          </div>

          {/* Right Side - Content */}
          <div className={styles.aboutContent}>
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
          </div>
        </div>
      </section>

      {/* Skills & Technologies Section */}
      <section className={styles.skillsSection}>
        <div className={styles.skillsScrollContainer}>
          <div className={styles.skillsGroups}>
            {/* UI/UX Design Group */}
            <div className={styles.skillGroup}>
              <h3 className={styles.groupTitle}>*UI/UX Design</h3>
              <div className={styles.skillsRow}>
                <div className={styles.skillItem}>
                  <div className={styles.skillIconLarge}>
                    <Image src="/icons/figma.svg" alt="Figma" width={40} height={40} />
                  </div>
                  <span className={styles.skillLabel}>*Figma</span>
                </div>
              </div>
            </div>

            {/* Front-End Development Group */}
            <div className={styles.skillGroup}>
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
              </div>
            </div>

            {/* Back-End Development Group */}
            <div className={styles.skillGroup}>
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
              </div>
            </div>

            {/* Programming Group */}
            <div className={styles.skillGroup}>
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
            </div>

            {/* Photography Group */}
            <div className={styles.skillGroup}>
              <h3 className={styles.groupTitle}>*Photography</h3>
              <div className={styles.skillsRow}>
                <div className={styles.skillItem}>
                  <div className={styles.skillIconLarge}>
                    <Image src="/icons/lightroom.svg" alt="Lightroom" width={40} height={40} />
                  </div>
                  <span className={styles.skillLabel}>*Lightroom</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className={styles.skillsHeadingRight}>
          <div className={styles.skillsTitleBlock}>
            <div className={styles.skillsTitleMain}>{/* paProjects style */}SKILLS</div>
            <div className={styles.skillsTitleSub}>{/* paAchievements style */}TECHNOLOGIES</div>
          </div>
        </div>
      </section>

      {/* Projects & Achievements Section - Screenshot Match */}
      <section className={styles.projectsAchievementsSection}>
        <div className={styles.paColumns2}>
          {/* Left: Titles */}
          <div className={styles.paLeft2}>
            <div className={styles.paProjects}>PROJECTS</div>
            <div className={styles.paAmp}>&</div>
            <div className={styles.paAchievements}>ACHIEVEMENTS</div>
          </div>
          {/* Center: Project Blocks Vertical Scrollable */}
          <div className={styles.paCenter2}>
            <div className={styles.verticalCarousel}>
              {paData.map((item, idx) => (
                <div className={styles.paBlock} key={idx}>
                  <div className={styles.paTitleRow}>
                    <div className={styles.paMainTitle + (item.scholarship ? ' ' + styles.paScholarshipTitle : '')}>
                      {item.title}
                    </div>
                    <div className={styles.paRightLabel}>{item.rightLabel}</div>
                  </div>
                  <div className={styles.paSubtitle}>{item.subtitle}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <h3 className={styles.contactTitle}>GET IN TOUCH</h3>
          <p className={styles.copyright}>© 2024 Designed and Developed by Ahmed Baha Eddine Alimi</p>
        </div>
      </footer>
    </div>
  );
}
