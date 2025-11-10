/**
 * React Starter Kit (https://github.com/xuanhoa88/rapid-rsk/)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import PropTypes from 'prop-types';
import s from './Contact.css';

function Contact({ title }) {
  return (
    <div className={s.root}>
      <div className={s.container}>
        <h1>{title}</h1>
        <p className={s.lead}>
          We&apos;d love to hear from you! Whether you have a question,
          feedback, or just want to say hello, feel free to reach out to us.
        </p>

        <div className={s.content}>
          <div className={s.section}>
            <h2>Get in Touch</h2>
            <div className={s.contactInfo}>
              <div className={s.contactItem}>
                <strong>Email:</strong>
                <a href='mailto:hello@xtepify.com'>hello@xtepify.com</a>
              </div>
              <div className={s.contactItem}>
                <strong>Phone:</strong>
                <a href='tel:+84966666666'>+84 966 666 666</a>
              </div>
              <div className={s.contactItem}>
                <strong>Address:</strong>
                <span>Xuan Hoa, Vinh Phuc, Viet Nam</span>
              </div>
            </div>
          </div>

          <div className={s.section}>
            <h2>Send Us a Message</h2>
            <form className={s.form}>
              <div className={s.formGroup}>
                <label htmlFor='name'>Name</label>
                <input
                  type='text'
                  id='name'
                  name='name'
                  placeholder='Your name'
                  required
                />
              </div>
              <div className={s.formGroup}>
                <label htmlFor='email'>Email</label>
                <input
                  type='email'
                  id='email'
                  name='email'
                  placeholder='your.email@example.com'
                  required
                />
              </div>
              <div className={s.formGroup}>
                <label htmlFor='subject'>Subject</label>
                <input
                  type='text'
                  id='subject'
                  name='subject'
                  placeholder='What is this about?'
                  required
                />
              </div>
              <div className={s.formGroup}>
                <label htmlFor='message'>Message</label>
                <textarea
                  id='message'
                  name='message'
                  rows='5'
                  placeholder='Your message...'
                  required
                />
              </div>
              <button type='submit' className={s.submitButton}>
                Send Message
              </button>
            </form>
          </div>

          <div className={s.section}>
            <h2>Connect With Us</h2>
            <div className={s.socialLinks}>
              <a
                href='https://github.com/xuanhoa88/rapid-rsk'
                className={s.socialLink}
              >
                GitHub
              </a>
              <a href='https://twitter.com' className={s.socialLink}>
                Twitter
              </a>
              <a href='https://linkedin.com' className={s.socialLink}>
                LinkedIn
              </a>
              <a href='https://facebook.com' className={s.socialLink}>
                Facebook
              </a>
            </div>
          </div>

          <div className={s.section}>
            <h2>Office Hours</h2>
            <div className={s.hours}>
              <div className={s.hourItem}>
                <span>Monday - Friday:</span>
                <span>9:00 AM - 6:00 PM PST</span>
              </div>
              <div className={s.hourItem}>
                <span>Saturday:</span>
                <span>10:00 AM - 4:00 PM PST</span>
              </div>
              <div className={s.hourItem}>
                <span>Sunday:</span>
                <span>Closed</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

Contact.propTypes = {
  title: PropTypes.string.isRequired,
};

export default Contact;
