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
                1. About This Privacy Policy
              </h2>

              <p>
                This Privacy Policy explains how OneKey Estate Agents Limited
                ("OneKey", "we", "us" or "our") collects, uses, stores and
                otherwise processes personal data when you visit or use our
                website, contact us, enquire about a property, request a
                viewing, submit a review, or otherwise interact with our
                website and services.
              </p>

              <p className="mt-4">
                We are committed to handling personal data fairly, lawfully and
                transparently and in accordance with applicable UK data
                protection and privacy legislation, including the UK General
                Data Protection Regulation ("UK GDPR"), the Data Protection Act
                2018 and, where applicable, the Privacy and Electronic
                Communications Regulations ("PECR").
              </p>

              <div className="mt-6 bg-gray-50 rounded-2xl p-5 space-y-1">
                <p>
                  <strong>Company:</strong> OneKey Estate Agents Limited
                </p>
                <p>
                  <strong>Company number:</strong> 17392934
                </p>
                <p>
                  <strong>Registered office:</strong> Netherend Neighbourhood
                  Centre, 13 Mogul Lane, Halesowen, United Kingdom, B63 2QQ
                </p>
                <p>
                  <strong>Primary contact email:</strong>{" "}
                  info@onekey.co.uk
                </p>
              </div>

              <p className="mt-4">
                Our intended primary website domain is{" "}
                <strong>onekey.co.uk</strong>. At the date of this Privacy
                Policy, that domain has not yet been confirmed as acquired or
                operational by OneKey.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#1c3053] mb-4">
                2. Data Controller
              </h2>

              <p>
                OneKey Estate Agents Limited is the data controller for
                personal data processed by us in connection with our website
                and the services we provide, except where applicable law
                requires another organisation to act as the controller.
              </p>

              <p className="mt-4">
                We have not currently designated a Data Protection Officer
                ("DPO"). If a formal DPO is required or appointed, this Privacy
                Policy will be updated accordingly.
              </p>

              <p className="mt-4">
                <strong>Data protection contact:</strong>{" "}
                [REQUIRES CONFIRMATION]
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#1c3053] mb-4">
                3. Personal Data We May Collect
              </h2>

              <p className="mb-4">
                The personal data we process depends on how you interact with
                us. It may include:
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>
                  Your name and other information you provide to identify
                  yourself.
                </li>
                <li>Your email address, where provided.</li>
                <li>Your telephone number, where provided.</li>
                <li>
                  Messages, enquiries and other information you voluntarily
                  submit to us.
                </li>
                <li>
                  Property-related information associated with an enquiry or
                  viewing request.
                </li>
                <li>
                  Viewing information, including the property selected, agent
                  selected, requested date, start time and end time.
                </li>
                <li>
                  Information contained in reviews submitted through the
                  website.
                </li>
                <li>
                  Information associated with authorised administrative
                  accounts where relevant.
                </li>
                <li>
                  Technical and security information necessary to operate and
                  protect the website and its systems.
                </li>
                <li>
                  Information contained in communications between you and
                  OneKey.
                </li>
              </ul>

              <p className="mt-4">
                We do not ask website users to provide special category
                personal data through ordinary contact or viewing forms. You
                should not voluntarily provide sensitive personal information
                through a general enquiry form unless it is genuinely necessary
                and requested by us.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#1c3053] mb-4">
                4. How Personal Data Is Collected
              </h2>

              <p className="mb-4">
                We may collect personal data:
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>
                  directly from you when you submit a contact form;
                </li>
                <li>
                  when you send a property-related enquiry;
                </li>
                <li>
                  when you request a property viewing;
                </li>
                <li>
                  when you submit information through another website
                  functionality;
                </li>
                <li>
                  when you communicate with us by email, telephone or another
                  communication method;
                </li>
                <li>
                  from information generated through the operation and security
                  of our website; and
                </li>
                <li>
                  where relevant to our agency services, from landlords,
                  property owners, agents or other parties involved in a
                  property transaction or service.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#1c3053] mb-4">
                5. Contact Forms and General Enquiries
              </h2>

              <p>
                Our public contact form allows you to provide your full name,
                email address, telephone number and message. An email address or
                telephone number is required so that we have at least one
                practical means of responding to your enquiry.
              </p>

              <p className="mt-4">
                Information submitted through the contact form is stored in our
                database and may also be transmitted through the systems used to
                deliver the enquiry to our intended company contact address,
                currently info@onekey.co.uk.
              </p>

              <p className="mt-4">
                We use this information to respond to your enquiry, communicate
                with you about matters you have raised, and take appropriate
                steps in response to your request.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#1c3053] mb-4">
                6. Property Enquiries
              </h2>

              <p>
                If you contact us about a particular property, we may process
                your name, email address, telephone number, message and the
                property associated with your enquiry.
              </p>

              <p className="mt-4">
                We use this information to respond to your enquiry, communicate
                with you about the relevant property and, where appropriate,
                progress a potential agency or letting transaction.
              </p>

              <p className="mt-4">
                We may need to share relevant information with the property
                owner, landlord, agent or another party involved in dealing with
                your enquiry where this is necessary and lawful.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#1c3053] mb-4">
                7. Property Viewing Requests
              </h2>

              <p>
                Our website allows users to request property viewings. The
                viewing system currently collects the customer's name,
                telephone number, selected property, selected agent, viewing
                date, viewing start time and viewing end time.
              </p>

              <p className="mt-4">
                The website currently does not require an email address when a
                viewing request is submitted.
              </p>

              <p className="mt-4">
                Viewing requests are used to administer the requested
                appointment and communicate with the customer where a suitable
                contact method has been provided.
              </p>

              <p className="mt-4">
                A viewing request is not itself a tenancy agreement, an offer
                of tenancy, a reservation of a property, or a guarantee that
                the property will remain available or that the customer will
                be offered the property.
              </p>

              <p className="mt-4">
                Viewing availability may be affected by Sundays being
                unavailable, blocked dates or times, existing bookings and
                agent availability.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#1c3053] mb-4">
                8. Reviews
              </h2>

              <p>
                Our website includes a reviews feature. Information contained
                in reviews submitted through the website may be processed and,
                where the review has been approved for publication, displayed
                publicly on the website.
              </p>

              <p className="mt-4">
                Reviews may be managed through our administrative systems. We
                do not currently state that every review has been independently
                verified.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#1c3053] mb-4">
                9. Administrative Accounts
              </h2>

              <p>
                OneKey operates a private administrative system used by
                authorised company or administrative users to manage aspects of
                the website and agency information.
              </p>

              <p className="mt-4">
                The administrative system is not intended for ordinary public
                users and does not provide a general public registration
                facility.
              </p>

              <p className="mt-4">
                Administrative access uses Supabase Authentication. Authorised
                users may be able to manage properties, property images,
                agents, bookings, blocked dates, messages and reviews,
                depending on their authorised access.
              </p>

              <p className="mt-4">
                Authentication and administrative access are protected by
                appropriate technical controls, including authentication and
                database access controls. Access is intended to be limited to
                authorised users.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#1c3053] mb-4">
                10. Purposes of Processing
              </h2>

              <p className="mb-4">
                Depending on the circumstances, we may process personal data
                for the following purposes:
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>responding to enquiries and communications;</li>
                <li>dealing with property enquiries;</li>
                <li>administering viewing requests;</li>
                <li>
                  communicating with customers, prospective customers,
                  landlords, property owners and other relevant parties;
                </li>
                <li>
                  providing and administering our estate and letting agency
                  services;
                </li>
                <li>
                  maintaining appropriate business and transaction records;
                </li>
                <li>
                  complying with applicable legal and regulatory obligations;
                </li>
                <li>
                  preventing fraud, misuse, unauthorised access and other
                  security incidents;
                </li>
                <li>
                  maintaining, securing and improving our website and systems;
                </li>
                <li>
                  administering authorised internal accounts and permissions;
                </li>
                <li>
                  handling complaints, disputes and potential or actual legal
                  claims; and
                </li>
                <li>
                  displaying approved website reviews and other content where
                  applicable.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#1c3053] mb-4">
                11. Lawful Bases for Processing
              </h2>

              <p>
                We will only process personal data where we have an applicable
                lawful basis under UK data protection law.
              </p>

              <div className="mt-6 space-y-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Responding to enquiries
                  </h3>
                  <p>
                    Depending on the nature of the enquiry, we may rely on our
                    legitimate interests in responding to communications and
                    operating our business, or on processing being necessary to
                    take steps at the individual's request before entering into
                    a contract where that basis genuinely applies.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Viewing requests
                  </h3>
                  <p>
                    We may process information necessary to administer a
                    requested viewing on the basis of our legitimate interests
                    in arranging and managing property viewings and responding
                    to prospective customers. Where the processing genuinely
                    relates to steps requested before entering into a contract,
                    the contractual/pre-contractual lawful basis may also
                    apply.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Existing contractual relationships
                  </h3>
                  <p>
                    Where you have entered into a contract with OneKey,
                    processing that is necessary to perform that contract may
                    be carried out on the contractual lawful basis.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Legal and regulatory obligations
                  </h3>
                  <p>
                    Where applicable law requires us to retain, disclose or
                    otherwise process personal data, we may rely on the lawful
                    basis of compliance with a legal obligation.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Security and fraud prevention
                  </h3>
                  <p>
                    We may process information where necessary for our
                    legitimate interests in maintaining the security and
                    integrity of our website, systems and business, preventing
                    misuse and protecting our rights and those of others.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Consent
                  </h3>
                  <p>
                    Where consent is required by law, including where required
                    for certain non-essential storage or access technologies,
                    we will seek consent before carrying out the relevant
                    processing.
                  </p>
                </div>
              </div>

              <p className="mt-6">
                Where we rely on legitimate interests, we will consider the
                purpose of the processing, whether the processing is necessary
                and whether the individual's interests, rights or freedoms
                override our legitimate interests.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#1c3053] mb-4">
                12. Estate and Letting Agency Processing
              </h2>

              <p>
                Where you engage with OneKey in connection with an estate or
                letting agency service, we may need to process additional
                personal information necessary to administer the relevant
                transaction or service.
              </p>

              <p className="mt-4">
                Depending on the service actually provided, this may include
                information required for applications, referencing, identity
                checks, anti-money laundering requirements, contractual
                administration, rent or deposit administration, regulatory
                compliance, accounting, complaints and dispute resolution.
              </p>

              <p className="mt-4">
                The precise processing undertaken will depend on the service
                provided and the circumstances of the transaction. We will
                provide additional privacy information where appropriate.
              </p>

              <p className="mt-4">
                <strong>
                  [REQUIRES CONFIRMATION: final estate/letting agency
                  processing, AML arrangements, client-money arrangements,
                  deposit arrangements and any property-management processing]
                </strong>
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#1c3053] mb-4">
                13. Information Sharing
              </h2>

              <p className="mb-4">
                We may disclose personal data where reasonably necessary and
                lawful to:
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>
                  authorised OneKey personnel and agents who need the
                  information to perform their role;
                </li>
                <li>
                  landlords or property owners where relevant to an enquiry,
                  viewing or transaction;
                </li>
                <li>
                  service providers and technology providers acting on our
                  behalf;
                </li>
                <li>
                  professional advisers where reasonably necessary;
                </li>
                <li>
                  regulators, government authorities, law-enforcement bodies or
                  courts where legally required or permitted;
                </li>
                <li>
                  other parties where disclosure is necessary to establish,
                  exercise or defend legal rights or claims; and
                </li>
                <li>
                  other parties where disclosure is necessary to provide a
                  service requested by you and is otherwise lawful.
                </li>
              </ul>

              <p className="mt-4">
                We do not sell personal data.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#1c3053] mb-4">
                14. Service Providers and Technology
              </h2>

              <p>
                Our website and systems use third-party technology providers,
                including Supabase and Vercel.
              </p>

              <p className="mt-4">
                Supabase is used for database and authentication functionality,
                including the systems supporting administrative access.
                Vercel is used for website hosting and deployment.
              </p>

              <p className="mt-4">
                Other technical components used by the website include Next.js,
                React, Framer Motion, Lucide React and Model Viewer. The use of
                a software library or technical component does not by itself
                mean that the relevant provider receives personal data from
                OneKey.
              </p>

              <p className="mt-4">
                The exact categories of processing, sub-processors, processing
                locations, retention arrangements and international-transfer
                safeguards applicable to our configuration will be confirmed
                before launch where relevant.
              </p>

              <p className="mt-4">
                <strong>
                  [REQUIRES CONFIRMATION: applicable provider terms, data
                  processing arrangements, sub-processors, processing
                  locations and international-transfer safeguards]
                </strong>
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#1c3053] mb-4">
                15. International Transfers
              </h2>

              <p>
                Some of our service providers or their sub-processors may
                process personal data outside the United Kingdom. Whether an
                international transfer takes place depends on the services,
                configuration and processing arrangements applicable to our
                systems.
              </p>

              <p className="mt-4">
                Where a restricted transfer occurs, we will use an appropriate
                legal mechanism and safeguards required by applicable data
                protection law.
              </p>

              <p className="mt-4">
                <strong>
                  [REQUIRES CONFIRMATION: actual international transfers and
                  applicable transfer safeguards]
                </strong>
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#1c3053] mb-4">
                16. Data Retention
              </h2>

              <p>
                We retain personal data for no longer than reasonably necessary
                for the purposes for which it is processed.
              </p>

              <p className="mt-4">
                The period for which information is retained depends on factors
                including the nature and purpose of the processing, whether an
                ongoing business relationship exists, applicable legal and
                regulatory obligations, limitation periods, dispute resolution
                requirements, legitimate business requirements and the need to
                establish, exercise or defend legal claims.
              </p>

              <p className="mt-4">
                Where a specific retention period is required or established,
                our internal retention schedule will determine the applicable
                period.
              </p>

              <p className="mt-4">
                <strong>
                  [REQUIRES CONFIRMATION: formal retention schedule and
                  category-specific retention periods]
                </strong>
              </p>

              <p className="mt-4">
                When personal data is no longer required, we will take
                reasonable steps to delete, securely dispose of or anonymise it
                where appropriate, subject to applicable legal requirements and
                technical limitations.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#1c3053] mb-4">
                17. Security
              </h2>

              <p>
                We use reasonable technical and organisational measures
                designed to protect personal data against unauthorised access,
                accidental loss, destruction, misuse, alteration or disclosure.
              </p>

              <p className="mt-4">
                Administrative functionality is protected by authentication
                controls and database access controls, including Supabase Row
                Level Security where applicable.
              </p>

              <p className="mt-4">
                No method of transmitting or storing information electronically
                can be guaranteed to be completely secure. Accordingly, we do
                not represent that personal data can never be lost, accessed,
                disclosed or compromised.
              </p>

              <p className="mt-4">
                Where we become aware of a personal data breach requiring
                notification under applicable law, we will take the steps
                required by law.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#1c3053] mb-4">
                18. Cookies and Storage & Access Technologies
              </h2>

              <p>
                Our website may use cookies and other technologies that store
                information on, or access information from, a user's device.
                Depending on how the website is configured, this can include
                cookies, web storage such as localStorage or sessionStorage,
                scripts, tags or other storage and access technologies.
              </p>

              <p className="mt-4">
                Some technologies may be strictly necessary to provide a
                functionality requested by you, maintain security, operate
                authentication or otherwise operate the website.
              </p>

              <p className="mt-4">
                We will not introduce non-essential analytics, advertising or
                tracking technologies requiring consent without implementing
                the appropriate information and consent mechanism.
              </p>

              <p className="mt-4">
                The exact cookies and storage/access technologies used by the
                production website must be reviewed before launch.
              </p>

              <p className="mt-4">
                <strong>
                  [REQUIRES CONFIRMATION: production cookie, localStorage,
                  analytics, tracking and other storage/access technology
                  inventory]
                </strong>
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#1c3053] mb-4">
                19. Marketing Communications
              </h2>

              <p>
                We do not currently operate a newsletter or dedicated marketing
                email system.
              </p>

              <p className="mt-4">
                We may send communications necessary to respond to an enquiry,
                administer a viewing, provide a service or manage an existing
                relationship. Such service communications are not treated as
                optional marketing merely because they are sent electronically.
              </p>

              <p className="mt-4">
                If we introduce electronic direct marketing in the future, we
                will comply with applicable data protection and electronic
                communications requirements, including PECR where applicable.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#1c3053] mb-4">
                20. Automated Decision-Making and Profiling
              </h2>

              <p>
                We do not currently intend to make decisions about individuals
                using solely automated processing that produce legal effects or
                similarly significant effects.
              </p>

              <p className="mt-4">
                If this changes, we will provide any information and safeguards
                required by applicable data protection law.
              </p>

              <p className="mt-4">
                <strong>
                  [REQUIRES CONFIRMATION BEFORE LAUNCH: confirm that no
                  automated decision-making or profiling with legal or similarly
                  significant effects is implemented]
                </strong>
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#1c3053] mb-4">
                21. Your Data Protection Rights
              </h2>

              <p className="mb-4">
                Depending on the circumstances and subject to applicable
                conditions and exemptions, you may have rights under UK data
                protection law including:
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>
                  the right to be informed about how your personal data is
                  processed;
                </li>
                <li>
                  the right to request access to personal data we hold about
                  you;
                </li>
                <li>
                  the right to request correction of inaccurate or incomplete
                  personal data;
                </li>
                <li>
                  the right to request erasure of personal data in certain
                  circumstances;
                </li>
                <li>
                  the right to request restriction of processing in certain
                  circumstances;
                </li>
                <li>
                  the right to object to certain processing, including
                  processing based on legitimate interests in circumstances
                  where that right applies;
                </li>
                <li>
                  the right to data portability where the applicable legal
                  conditions are satisfied;
                </li>
                <li>
                  the right to withdraw consent where processing is based on
                  consent; and
                </li>
                <li>
                  rights relating to automated decision-making where applicable
                  under data protection law.
                </li>
              </ul>

              <p className="mt-4">
                These rights are not absolute and may be subject to conditions,
                exemptions and circumstances in which another lawful basis or
                legal requirement permits or requires us to retain or process
                information.
              </p>

              <p className="mt-4">
                In particular, we may need to retain information where required
                by law, necessary to establish, exercise or defend legal claims,
                or where another applicable exemption applies.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#1c3053] mb-4">
                22. How to Exercise Your Rights
              </h2>

              <p>
                To exercise a data protection right or ask a question about our
                processing of your personal data, please contact us using:
              </p>

              <div className="mt-4 bg-gray-50 rounded-2xl p-5">
                <p>
                  <strong>Email:</strong> info@onekey.co.uk
                </p>
                <p className="mt-2">
                  <strong>Data protection contact:</strong>{" "}
                  [REQUIRES CONFIRMATION]
                </p>
              </div>

              <p className="mt-4">
                We may need to verify your identity before responding to a
                request where this is reasonably necessary to protect personal
                data against unauthorised disclosure.
              </p>

              <p className="mt-4">
                We will deal with valid requests within the period required by
                applicable law.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#1c3053] mb-4">
                23. Children's Data
              </h2>

              <p>
                Our estate and letting agency services are not directed at
                children, and we do not intentionally seek to collect
                children's personal data through ordinary website enquiry
                functionality.
              </p>

              <p className="mt-4">
                If you believe that a child has provided personal data to us
                unnecessarily, please contact us so that we can consider the
                appropriate action.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#1c3053] mb-4">
                24. Complaints
              </h2>

              <p>
                If you have concerns about how we have handled your personal
                data, we ask that you contact us first so that we have an
                opportunity to investigate and try to resolve your concern.
              </p>

              <p className="mt-4">
                You also have the right to complain to the Information
                Commissioner's Office ("ICO") if you believe that your personal
                data has been processed unlawfully or that your data protection
                rights have not been respected.
              </p>

              <p className="mt-4">
                Information about the ICO and how to make a complaint is
                available at{" "}
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

              <p className="mt-4">
                <strong>
                  ICO registration/status: [REQUIRES CONFIRMATION]
                </strong>
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#1c3053] mb-4">
                25. Changes to This Privacy Policy
              </h2>

              <p>
                We may update this Privacy Policy from time to time to reflect
                changes to our website, services, technology, legal
                requirements, regulatory obligations or business practices.
              </p>

              <p className="mt-4">
                The latest version will be published on this page and will
                identify the date on which it was last updated.
              </p>

              <p className="mt-4">
                Where a change materially affects how we process personal data,
                we will take appropriate steps to provide any information or
                notice required by applicable law.
              </p>
            </section>

            <section className="border-t border-gray-100 pt-8">
              <h2 className="text-2xl font-semibold text-[#1c3053] mb-4">
                26. Contact Us
              </h2>

              <p>
                If you have questions about this Privacy Policy, our use of
                personal data or your data protection rights, please contact:
              </p>

              <div className="mt-4 bg-gray-50 rounded-2xl p-5">
                <p>
                  <strong>OneKey Estate Agents Limited</strong>
                </p>
                <p>Company number: 17392934</p>
                <p>
                  Netherend Neighbourhood Centre, 13 Mogul Lane, Halesowen,
                  United Kingdom, B63 2QQ
                </p>
                <p className="mt-2">
                  Email:{" "}
                  <a
                    href="mailto:info@onekey.co.uk"
                    className="text-[#ae884e] hover:underline"
                  >
                    info@onekey.co.uk
                  </a>
                </p>
                <p className="mt-2">
                  Telephone: [TELEPHONE NUMBER TO BE CONFIRMED]
                </p>
              </div>

              <p className="mt-4">
                You may also use our{" "}
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