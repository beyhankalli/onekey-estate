"use client";

import { motion } from "framer-motion";

export default function TermsOfServicePage() {
  return (
    <div className="bg-gray-50 min-h-screen pt-32 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-gray-900 mb-5">
              Terms of Service<span className="text-[#ae884e]">.</span>
            </h1>

            <p className="text-gray-500 font-light">
              Last updated: 7 September 2026
            </p>
          </div>

          <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-8 md:p-12 space-y-10 text-gray-700 leading-relaxed">
            <section>
              <h2 className="text-2xl font-semibold text-[#1c3053] mb-4">
                1. About These Terms
              </h2>

              <p>
                These Terms of Service explain the terms that apply when you
                use the OneKey Estate Agency website and its online property
                services.
              </p>

              <p className="mt-4">
                By using our website, you agree to use it lawfully and in
                accordance with these Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#1c3053] mb-4">
                2. About OneKey
              </h2>

              <div className="bg-gray-50 rounded-2xl p-5">
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
                3. Use of Our Website
              </h2>

              <p className="mb-4">
                You agree that when using our website you will:
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>Provide accurate information when submitting an enquiry or booking.</li>
                <li>Use the website only for lawful purposes.</li>
                <li>Not attempt to gain unauthorised access to the website or administrative systems.</li>
                <li>Not interfere with the operation or security of the website.</li>
                <li>Not use the website to submit fraudulent, abusive or misleading information.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#1c3053] mb-4">
                4. Property Listings
              </h2>

              <p>
                We aim to ensure that property information displayed on our
                website is accurate and up to date. However, property
                availability, rental prices, photographs, descriptions,
                specifications and other information may change.
              </p>

              <p className="mt-4">
                A property appearing on our website does not guarantee that it
                will remain available or that an application for the property
                will be accepted.
              </p>

              <p className="mt-4">
                Property photographs, floor plans, 3D models and other
                materials are provided to help you understand a property and
                may not represent every aspect or current condition of the
                property.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#1c3053] mb-4">
                5. Viewing Bookings
              </h2>

              <p>
                Our website allows you to request a property viewing by
                selecting an available date and time.
              </p>

              <p className="mt-4">
                A viewing request is not a tenancy agreement, reservation of
                the property, offer of a tenancy, or guarantee that the
                property will be available when you attend.
              </p>

              <p className="mt-4">
                We may need to change or cancel a viewing because of
                circumstances such as property availability, access
                restrictions, agent availability, emergencies or other
                reasonable operational requirements. Where reasonably possible,
                we will contact you about any change.
              </p>

              <p className="mt-4">
                Please provide accurate contact information so that we can
                contact you about your viewing.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#1c3053] mb-4">
                6. Tenancies and Applications
              </h2>

              <p>
                Viewing a property or submitting an enquiry does not create a
                tenancy or guarantee that you will be offered a tenancy.
              </p>

              <p className="mt-4">
                Any tenancy will be subject to separate terms, eligibility
                requirements, referencing or other applicable processes and
                documentation.
              </p>

              <p className="mt-4">
                Where applicable, the terms of a tenancy agreement will take
                precedence over information provided through this website.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#1c3053] mb-4">
                7. Website Availability
              </h2>

              <p>
                We aim to keep our website available and functioning correctly,
                but we do not guarantee that it will always be uninterrupted,
                error-free or available at all times.
              </p>

              <p className="mt-4">
                We may temporarily suspend, update or modify parts of the
                website for maintenance, security, technical or operational
                reasons.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#1c3053] mb-4">
                8. Intellectual Property
              </h2>

              <p>
                Unless otherwise stated, the content of this website,
                including text, branding, graphics, photographs, design,
                software and other materials, belongs to or is licensed to
                OneKey Estate Agents Limited.
              </p>

              <p className="mt-4">
                You may view and use the website for your personal and
                legitimate property-search purposes. You must not reproduce,
                distribute, modify, commercially exploit or republish our
                content without appropriate permission.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#1c3053] mb-4">
                9. Third-Party Services and Links
              </h2>

              <p>
                Our website may contain links to third-party websites or use
                third-party services. These services may have their own terms
                and privacy policies.
              </p>

              <p className="mt-4">
                We are not responsible for the content, availability or
                practices of third-party websites that are outside our control.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#1c3053] mb-4">
                10. Limitation of Liability
              </h2>

              <p>
                Nothing in these Terms excludes or limits any liability that
                cannot lawfully be excluded or limited, including liability for
                death or personal injury caused by negligence, fraud or
                fraudulent misrepresentation, or any other liability that
                applicable law does not permit us to exclude or limit.
              </p>

              <p className="mt-4">
                Subject to applicable law, we are not responsible for losses
                arising from circumstances outside our reasonable control,
                including technical failures, internet outages, third-party
                service interruptions or changes in property availability.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#1c3053] mb-4">
                11. Privacy
              </h2>

              <p>
                Our collection and use of personal information is explained in
                our{" "}
                <a
                  href="/privacy-policy"
                  className="text-[#ae884e] hover:underline"
                >
                  Privacy Policy
                </a>
                .
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#1c3053] mb-4">
                12. Changes to These Terms
              </h2>

              <p>
                We may update these Terms from time to time to reflect changes
                to our website, services, business practices or legal
                requirements.
              </p>

              <p className="mt-4">
                The latest version will be published on this page with the
                relevant update date.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#1c3053] mb-4">
                13. Complaints and Disputes
              </h2>

              <p>
                If you have a complaint about our website or services, please
                contact us first so that we can investigate and try to resolve
                the issue.
              </p>

              <p className="mt-4">
                Nothing in these Terms prevents you from exercising any legal
                rights or remedies available to you under applicable law.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#1c3053] mb-4">
                14. Governing Law
              </h2>

              <p>
                These Terms are governed by the laws of England and Wales,
                subject to any mandatory consumer protection rights that apply
                to you.
              </p>

              <p className="mt-4">
                The courts of England and Wales will have jurisdiction,
                subject to any mandatory rights you may have under applicable
                consumer law.
              </p>
            </section>

            <section className="border-t border-gray-100 pt-8">
              <h2 className="text-2xl font-semibold text-[#1c3053] mb-4">
                15. Contact Us
              </h2>

              <p>
                If you have any questions about these Terms or our services,
                please contact OneKey Estate Agents Limited through our{" "}
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