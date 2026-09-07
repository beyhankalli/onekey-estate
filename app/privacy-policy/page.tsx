"use client";

import { motion } from "framer-motion";

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-gray-50 min-h-screen pt-32 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-gray-900 mb-5">
              Privacy Policy<span className="text-[#ae884e]">.</span>
            </h1>

            <p className="text-gray-500 font-light">
              Last updated: 7 September 2026
            </p>
          </div>

          <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-8 md:p-12 space-y-10 text-gray-700 leading-relaxed">
            <section>
              <h2 className="text-2xl font-semibold text-[#1c3053] mb-4">
                1. Who We Are
              </h2>
              <p>
                This Privacy Policy explains how OneKey Estate Agents Limited
                collects, uses, stores and protects personal information when
                you use our website or contact us about our services.
              </p>

              <div className="mt-4 bg-gray-50 rounded-2xl p-5">
                <p><strong>Company:</strong> OneKey Estate Agents Limited</p>
                <p><strong>Company number:</strong> 17392934</p>
                <p>
                  <strong>Registered office:</strong> Netherend Neighbourhood
                  Centre, 13 Mogul Lane, Halesowen, United Kingdom, B63 2QQ
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#1c3053] mb-4">
                2. Information We Collect
              </h2>

              <p className="mb-4">
                Depending on how you use our website, we may collect the
                following information:
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>Your name.</li>
                <li>Your email address.</li>
                <li>Your telephone number.</li>
                <li>
                  Information you provide when contacting us or sending an
                  enquiry.
                </li>
                <li>
                  Information you provide when requesting or booking a
                  property viewing.
                </li>
                <li>
                  Property and viewing information associated with your
                  enquiry or booking.
                </li>
                <li>
                  Technical information required for the operation and
                  security of our website.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#1c3053] mb-4">
                3. How We Use Your Information
              </h2>

              <p className="mb-4">
                We may use your information to:
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>Respond to your enquiries and messages.</li>
                <li>Arrange and manage property viewings.</li>
                <li>
                  Communicate with you about a property or service you have
                  requested.
                </li>
                <li>Provide and operate our website.</li>
                <li>Maintain the security and reliability of our services.</li>
                <li>
                  Keep appropriate business records and comply with legal
                  obligations.
                </li>
                <li>
                  Improve our services and the experience provided through our
                  website.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#1c3053] mb-4">
                4. Lawful Basis for Processing
              </h2>

              <p>
                We process personal information where necessary to respond to
                requests, provide services you have asked for, take steps
                before entering into an arrangement with you, comply with our
                legal obligations, or where we have a legitimate interest in
                operating and improving our business and services.
              </p>

              <p className="mt-4">
                Where consent is required by law, we will request your consent
                before carrying out the relevant processing.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#1c3053] mb-4">
                5. Property Viewing Bookings
              </h2>

              <p>
                When you request a property viewing through our website, we
                collect the information necessary to arrange and manage the
                viewing. This may include your name, telephone number, chosen
                property, date and time of the viewing, and any information
                included in your enquiry.
              </p>

              <p className="mt-4">
                We use this information to process the viewing request and
                communicate with you regarding the appointment.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#1c3053] mb-4">
                6. How We Share Information
              </h2>

              <p>
                We do not sell your personal information.
              </p>

              <p className="mt-4">
                We may share personal information where necessary with our
                agents, service providers, technology providers, professional
                advisers, or other parties involved in providing a service you
                have requested.
              </p>

              <p className="mt-4">
                We may also disclose information where required by law,
                regulation, court order, or where necessary to protect our
                rights, property or the safety of individuals.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#1c3053] mb-4">
                7. Data Storage and Security
              </h2>

              <p>
                We take reasonable technical and organisational measures to
                protect personal information against unauthorised access,
                accidental loss, misuse, alteration or disclosure.
              </p>

              <p className="mt-4">
                Information submitted through our website may be stored using
                third-party technology and cloud service providers used to
                operate our services. Access to administrative information is
                restricted to authorised users.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#1c3053] mb-4">
                8. How Long We Keep Information
              </h2>

              <p>
                We keep personal information only for as long as reasonably
                necessary for the purposes for which it was collected,
                including to provide services, maintain appropriate business
                records, resolve disputes, and meet legal or regulatory
                requirements.
              </p>

              <p className="mt-4">
                When information is no longer required, we will take reasonable
                steps to securely delete or anonymise it.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#1c3053] mb-4">
                9. Cookies and Similar Technologies
              </h2>

              <p>
                Our website may use cookies or similar technologies that are
                necessary for the operation, security and functionality of the
                website.
              </p>

              <p className="mt-4">
                If we introduce non-essential analytics, advertising or other
                technologies that require consent, we will provide appropriate
                information and request consent where required.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#1c3053] mb-4">
                10. Your Data Protection Rights
              </h2>

              <p className="mb-4">
                Subject to applicable law, you may have the right to:
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>Request access to personal information we hold about you.</li>
                <li>Request correction of inaccurate or incomplete information.</li>
                <li>Request deletion of your personal information in certain circumstances.</li>
                <li>Request restriction of processing in certain circumstances.</li>
                <li>Object to certain processing.</li>
                <li>
                  Request transfer of certain personal information where the
                  right to data portability applies.
                </li>
                <li>
                  Withdraw consent where processing is based on consent.
                </li>
              </ul>

              <p className="mt-4">
                These rights are subject to applicable legal conditions and
                exemptions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#1c3053] mb-4">
                11. Complaints
              </h2>

              <p>
                If you have concerns about how we use your personal information,
                please contact us first so that we can try to resolve your
                concern.
              </p>

              <p className="mt-4">
                You also have the right to complain to the UK Information
                Commissioner's Office (ICO) if you believe your personal
                information has been handled unlawfully.
              </p>

              <p className="mt-4">
                Further information is available from the ICO at{" "}
                <a
                  href="https://ico.org.uk/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#ae884e] hover:underline"
                >
                  ico.org.uk
                </a>
                .
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#1c3053] mb-4">
                12. Changes to This Privacy Policy
              </h2>

              <p>
                We may update this Privacy Policy from time to time to reflect
                changes to our services, technology, legal requirements or
                business practices. The latest version will be published on
                this page with the relevant update date.
              </p>
            </section>

            <section className="border-t border-gray-100 pt-8">
              <h2 className="text-2xl font-semibold text-[#1c3053] mb-4">
                13. Contact Us
              </h2>

              <p>
                If you have any questions about this Privacy Policy or how we
                process personal information, please contact OneKey Estate
                Agents Limited through our{" "}
                <a
                  href="/contact"
                  className="text-[#ae884e] hover:underline"
                >
                  Contact Us
                </a>{" "}
                page.
              </p>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
}