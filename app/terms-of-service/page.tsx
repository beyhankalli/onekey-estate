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
              Terms of Use<span className="text-[#ae884e]">.</span>
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
                These Terms of Use govern your use of the OneKey Estate Agents
                Limited website and the website functionality made available
                through it.
              </p>

              <p className="mt-4">
                They are intended to apply to visitors, prospective customers
                and other users of the website. They do not by themselves
                constitute a contract for estate agency, letting,
                property-management or other professional services.
              </p>

              <p className="mt-4">
                Where you enter into a separate agreement with OneKey, that
                agreement will govern the relevant service and may contain terms
                that are additional to or different from these website Terms of
                Use.
              </p>

              <p className="mt-4">
                By using the website, you agree to comply with these Terms of
                Use and applicable law.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#1c3053] mb-4">
                2. About OneKey
              </h2>

              <div className="bg-gray-50 rounded-2xl p-5 space-y-1">
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
                  <strong>Email:</strong> info@onekey.co.uk
                </p>
                <p>
                  <strong>Telephone:</strong> [TELEPHONE NUMBER TO BE CONFIRMED]
                </p>
              </div>

              <p className="mt-4">
                Our intended primary website domain is{" "}
                <strong>onekey.co.uk</strong>. That domain is intended to be
                used once acquired and configured by OneKey.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#1c3053] mb-4">
                3. Website Use
              </h2>

              <p className="mb-4">
                You may use the website for lawful and legitimate purposes,
                including browsing properties, reviewing property information,
                contacting us and requesting property viewings.
              </p>

              <p className="mb-4">
                When using the website, you must:
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>
                  provide information that is accurate and not knowingly
                  misleading;
                </li>
                <li>use the website only for lawful purposes;</li>
                <li>
                  respect the rights of OneKey and third parties;
                </li>
                <li>
                  not attempt to gain unauthorised access to the website,
                  administrative portal, database or other systems;
                </li>
                <li>
                  not interfere with the security, availability or operation of
                  the website;
                </li>
                <li>
                  not introduce malicious software, code or other harmful
                  material;
                </li>
                <li>
                  not use the website to impersonate another person or submit
                  fraudulent information; and
                </li>
                <li>
                  not use automated means to scrape, copy or systematically
                  extract property information without our prior permission,
                  except where such use is permitted by law.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#1c3053] mb-4">
                4. Administrative Portal
              </h2>

              <p>
                The website includes a private administrative portal used by
                authorised OneKey personnel or other authorised users.
              </p>

              <p className="mt-4">
                The administrative portal is not intended for general public
                access. Public users must not attempt to access or use it
                without authorisation.
              </p>

              <p className="mt-4">
                Authorised users must keep their login credentials confidential
                and must not permit unauthorised persons to use their account.
                Any suspected unauthorised access should be reported to OneKey
                promptly.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#1c3053] mb-4">
                5. Property Listings and Information
              </h2>

              <p>
                Our website may display property descriptions, prices, rental
                information, photographs, floor plans, availability
                information, agent information and, for some properties,
                interactive three-dimensional models or tours.
              </p>

              <p className="mt-4">
                We aim to present property information accurately and to keep
                information reasonably up to date. However, property
                information may change, including price, availability,
                specification, photographs, floor plans, measurements,
                descriptions and other details.
              </p>

              <p className="mt-4">
                Some information may be supplied by landlords, property owners,
                vendors or other third parties. Information should therefore be
                considered in conjunction with any further information or
                documentation provided during the relevant transaction.
              </p>

              <p className="mt-4">
                Nothing in these Terms permits us knowingly to provide
                misleading information or excludes any legal duty that cannot
                lawfully be excluded.
              </p>

              <p className="mt-4">
                Property photographs, floor plans and 3D models are provided to
                assist with understanding a property. They may not show every
                aspect of the property or reflect every subsequent change to
                its condition or configuration.
              </p>

              <p className="mt-4">
                Where a property is of interest to you, you should make
                appropriate enquiries and satisfy yourself as to matters
                material to your decision before entering into a transaction.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#1c3053] mb-4">
                6. Property Availability and Pricing
              </h2>

              <p>
                The appearance of a property on the website does not guarantee
                that the property will remain available.
              </p>

              <p className="mt-4">
                Availability may change without notice, including as a result of
                an offer, transaction, withdrawal, landlord or seller
                instructions, timing issues or other circumstances affecting
                the property.
              </p>

              <p className="mt-4">
                Property prices and rental amounts may also change and should be
                confirmed before a transaction is entered into.
              </p>

              <p className="mt-4">
                Unless expressly stated otherwise, displaying a property on the
                website does not constitute an offer capable of acceptance to
                create a binding property transaction.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#1c3053] mb-4">
                7. Viewing Requests
              </h2>

              <p>
                The website allows users to request property viewings by
                selecting an available property, agent and viewing date and
                time.
              </p>

              <p className="mt-4">
                A submitted viewing request creates a pending request. It does
                not itself constitute:
              </p>

              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li>a tenancy agreement;</li>
                <li>an offer of tenancy;</li>
                <li>a reservation of the property;</li>
                <li>an offer to purchase;</li>
                <li>a binding property transaction; or</li>
                <li>
                  a guarantee that the property will remain available or that
                  the customer will be offered the property.
                </li>
              </ul>

              <p className="mt-4">
                Viewing availability is subject to operational availability,
                including Sundays being unavailable, blocked dates or times,
                existing bookings and agent availability.
              </p>

              <p className="mt-4">
                We may need to change, decline or cancel a viewing request
                where reasonably necessary, including because of property
                availability, access issues, agent availability, emergencies,
                safety concerns or other operational circumstances. Where
                reasonably possible, we will communicate relevant changes using
                the contact details provided.
              </p>

              <p className="mt-4">
                Users are responsible for providing accurate contact details
                and other information required to administer a viewing request.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#1c3053] mb-4">
                8. Property Enquiries and Communications
              </h2>

              <p>
                Submitting a property enquiry allows you to contact OneKey
                regarding a particular property or service.
              </p>

              <p className="mt-4">
                An enquiry does not create a tenancy, purchase contract,
                reservation, agency agreement or other binding transaction
                unless and until the relevant parties enter into the
                appropriate agreement.
              </p>

              <p className="mt-4">
                We may respond to an enquiry using the contact information
                provided and may, where appropriate and lawful, communicate
                relevant information to the landlord, property owner or agent
                dealing with the property.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#1c3053] mb-4">
                9. Tenancy Applications and Referencing
              </h2>

              <p>
                Where OneKey provides letting services, a viewing, enquiry or
                other website interaction does not guarantee that an applicant
                will be offered a tenancy.
              </p>

              <p className="mt-4">
                Any tenancy may be subject to separate contractual
                documentation, eligibility requirements, referencing,
                identification checks, affordability assessment, landlord
                approval and other applicable procedures.
              </p>

              <p className="mt-4">
                Nothing on this website should be interpreted as a guarantee
                that an applicant will pass referencing or be accepted by a
                landlord.
              </p>

              <p className="mt-4">
                Where a legally binding tenancy agreement is subsequently
                entered into, its terms will govern the tenancy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#1c3053] mb-4">
                10. Offers and Transactions
              </h2>

              <p>
                Where the website displays a property for sale or letting, the
                listing should not be treated as an offer that automatically
                creates a binding contract.
              </p>

              <p className="mt-4">
                Offers, applications and other expressions of interest may be
                subject to further checks, instructions, negotiations and
                acceptance procedures.
              </p>

              <p className="mt-4">
                A binding transaction will arise only in accordance with the
                applicable legal and contractual requirements.
              </p>

              <p className="mt-4">
                Nothing in these Terms prevents OneKey, a landlord, seller,
                buyer or tenant from entering into a separate legally binding
                agreement at a later stage.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#1c3053] mb-4">
                11. Letting Fees and Tenant Payments
              </h2>

              <p>
                Where OneKey provides letting services in England, any fees or
                payments requested from tenants or prospective tenants will be
                subject to applicable legislation, including the Tenant Fees Act
                2019 as amended and other applicable legal requirements.
              </p>

              <p className="mt-4">
                We will not use these website Terms to require a payment that
                applicable law prohibits a letting agent from requiring.
              </p>

              <p className="mt-4">
                Details of applicable agency fees and permitted tenant payments
                will be provided through the appropriate fee information and
                transaction documentation where required.
              </p>

              <p className="mt-4">
                <strong>
                  [REQUIRES CONFIRMATION: OneKey's final fee structure and
                  website Fees & Charges disclosure]
                </strong>
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#1c3053] mb-4">
                12. Client Money and Deposits
              </h2>

              <p>
                OneKey may receive or hold rent, deposits or other client money
                in connection with its letting activities.
              </p>

              <p className="mt-4">
                Where client money is held, OneKey will comply with applicable
                legal requirements governing the handling and protection of
                client money.
              </p>

              <p className="mt-4">
                The precise arrangements concerning client money, client money
                protection, tenancy deposits and relevant banking arrangements
                will be confirmed and documented before the relevant services
                commence.
              </p>

              <p className="mt-4">
                <strong>
                  [REQUIRES CONFIRMATION: Client Money Protection scheme,
                  certificate/details, client-money banking arrangements and
                  tenancy deposit protection arrangements]
                </strong>
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#1c3053] mb-4">
                13. Estate Agency and Regulatory Compliance
              </h2>

              <p>
                OneKey intends to provide estate and letting agency services in
                accordance with applicable law and regulatory requirements.
              </p>

              <p className="mt-4">
                Depending on the services provided, these requirements may
                include obligations concerning consumer protection, property
                information, anti-money laundering, redress, client money,
                tenancy deposits, fees and other matters.
              </p>

              <p className="mt-4">
                <strong>
                  [REQUIRES CONFIRMATION: applicable redress scheme]
                </strong>
              </p>

              <p className="mt-4">
                <strong>
                  [REQUIRES CONFIRMATION: HMRC anti-money laundering
                  registration/status]
                </strong>
              </p>

              <p className="mt-4">
                Nothing in these Terms is intended to exclude or limit any
                statutory or regulatory obligation that applies to OneKey.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#1c3053] mb-4">
                14. Customer Responsibilities
              </h2>

              <p className="mb-4">
                When interacting with OneKey through the website or in
                connection with our services, you should:
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>
                  provide accurate and reasonably complete information where
                  requested;
                </li>
                <li>
                  promptly tell us if information you have provided becomes
                  materially inaccurate;
                </li>
                <li>
                  attend agreed viewing appointments responsibly and comply
                  with reasonable property-access instructions;
                </li>
                <li>
                  not knowingly provide fraudulent or misleading information;
                </li>
                <li>
                  not misuse the website or administrative systems; and
                </li>
                <li>
                  comply with applicable laws and any separate contractual
                  terms governing a transaction.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#1c3053] mb-4">
                15. Intellectual Property
              </h2>

              <p>
                Unless otherwise stated, intellectual property rights in the
                website and its original content, including branding, text,
                graphics, design, software and other materials, belong to or are
                licensed to OneKey Estate Agents Limited or the relevant rights
                holder.
              </p>

              <p className="mt-4">
                Property photographs, floor plans, descriptions, 3D models and
                other materials may belong to OneKey, landlords, property
                owners, photographers, software providers or other third
                parties.
              </p>

              <p className="mt-4">
                You may access and use website content for legitimate personal
                property-search purposes. You must not reproduce, redistribute,
                commercially exploit, systematically scrape, modify or
                republish material from the website without permission, except
                where permitted by law.
              </p>

              <p className="mt-4">
                Nothing in these Terms restricts rights that cannot lawfully be
                restricted.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#1c3053] mb-4">
                16. Third-Party Services and Links
              </h2>

              <p>
                The website may use third-party technology or contain links to
                third-party websites and services.
              </p>

              <p className="mt-4">
                Third-party services may be subject to their own terms,
                privacy notices and policies.
              </p>

              <p className="mt-4">
                We do not control third-party websites or services and are not
                responsible for their content, availability or practices, except
                where applicable law provides otherwise.
              </p>

              <p className="mt-4">
                This does not exclude or limit any liability that OneKey cannot
                lawfully exclude or limit.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#1c3053] mb-4">
                17. Website Availability and Technical Issues
              </h2>

              <p>
                We aim to operate the website with reasonable care and to keep
                it available and functioning correctly. However, we do not
                guarantee that the website will always be uninterrupted,
                error-free, secure or available at all times.
              </p>

              <p className="mt-4">
                We may suspend, restrict, modify or temporarily remove
                functionality for maintenance, security, technical,
                operational or legal reasons.
              </p>

              <p className="mt-4">
                We may also depend on third-party hosting, authentication,
                database, communications and other infrastructure that is
                outside our direct control.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#1c3053] mb-4">
                18. Events Outside Our Reasonable Control
              </h2>

              <p>
                To the extent permitted by law, we will not be responsible for
                delay or failure caused by circumstances outside our reasonable
                control.
              </p>

              <p className="mt-4">
                Such circumstances may include major internet or network
                failures, third-party service interruptions, power failures,
                cyber incidents, natural events, governmental action,
                industrial disputes, emergencies or other circumstances that we
                could not reasonably prevent or overcome.
              </p>

              <p className="mt-4">
                This clause does not remove any consumer rights or liability
                that cannot lawfully be excluded or limited.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#1c3053] mb-4">
                19. Limitation of Liability
              </h2>

              <p>
                Nothing in these Terms excludes or limits liability that cannot
                lawfully be excluded or limited.
              </p>

              <p className="mt-4">
                This includes, where applicable, liability for death or personal
                injury caused by negligence, fraud or fraudulent
                misrepresentation, breach of statutory rights that cannot
                lawfully be excluded, or any other liability which applicable
                law does not permit us to exclude or restrict.
              </p>

              <p className="mt-4">
                Subject to those protections, we will not be responsible for
                losses caused solely by matters outside our reasonable control,
                failures of third-party services, interruptions to internet
                connectivity, changes in property availability, or information
                supplied by third parties where we have not caused the relevant
                loss through our own breach of duty.
              </p>

              <p className="mt-4">
                We do not guarantee that a property will remain available, that
                a viewing will take place, that an application will be accepted,
                that a tenancy will be granted, or that a property transaction
                will complete merely because information or functionality was
                made available through the website.
              </p>

              <p className="mt-4">
                Nothing in these Terms affects any statutory rights or remedies
                available to consumers under applicable law.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#1c3053] mb-4">
                20. Consumer Rights
              </h2>

              <p>
                If you are a consumer, you may have statutory rights under
                applicable consumer protection legislation, including the
                Consumer Rights Act 2015.
              </p>

              <p className="mt-4">
                Nothing in these Terms is intended to create an unfair term,
                exclude a statutory right that cannot lawfully be excluded, or
                prevent you from exercising a legal right or remedy available
                to you.
              </p>

              <p className="mt-4">
                If any provision of these Terms is found to be unfair,
                unenforceable or invalid, the remaining provisions will continue
                to apply to the extent permitted by law.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#1c3053] mb-4">
                21. Privacy
              </h2>

              <p>
                Our collection and use of personal data is explained in our{" "}
                <a
                  href="/privacy-policy"
                  className="text-[#ae884e] hover:underline"
                >
                  Privacy Policy
                </a>
                .
              </p>

              <p className="mt-4">
                The Privacy Policy forms an important part of the information
                provided to users of the website but does not itself create a
                tenancy, agency agreement or other property transaction.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#1c3053] mb-4">
                22. Complaints and Redress
              </h2>

              <p>
                If you have a complaint about our website or services, please
                contact us first so that we can investigate the matter and try
                to resolve it.
              </p>

              <p className="mt-4">
                Where applicable, customers may also have access to an approved
                property-agent redress scheme.
              </p>

              <p className="mt-4">
                <strong>
                  [REQUIRES CONFIRMATION: OneKey's approved property-agent
                  redress scheme and relevant membership/contact details]
                </strong>
              </p>

              <p className="mt-4">
                Nothing in these Terms prevents you from exercising any
                statutory or other legal rights available to you.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#1c3053] mb-4">
                23. Changes to These Terms
              </h2>

              <p>
                We may update these Terms from time to time to reflect changes
                to the website, services, business practices, legal
                requirements or regulatory obligations.
              </p>

              <p className="mt-4">
                The latest version will be published on this page with the date
                on which it was last updated.
              </p>

              <p className="mt-4">
                Where applicable law requires us to provide additional notice
                concerning a material change, we will do so.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#1c3053] mb-4">
                24. Severability
              </h2>

              <p>
                If any provision of these Terms is determined to be invalid,
                unlawful or unenforceable, that provision will be interpreted or
                modified to the minimum extent necessary to make it lawful and
                enforceable where legally possible.
              </p>

              <p className="mt-4">
                If this is not possible, the relevant provision will be treated
                as removed to the extent necessary, without affecting the
                validity of the remaining provisions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#1c3053] mb-4">
                25. Governing Law and Jurisdiction
              </h2>

              <p>
                These Terms are governed by the law of England and Wales.
              </p>

              <p className="mt-4">
                Subject to any mandatory rights or protections available to a
                consumer under the laws of another part of the United Kingdom
                or another applicable jurisdiction, the courts of England and
                Wales will have jurisdiction in relation to disputes concerning
                these Terms.
              </p>

              <p className="mt-4">
                Nothing in this clause is intended to deprive a consumer of a
                mandatory right to bring proceedings in another jurisdiction
                where applicable law gives them that right.
              </p>
            </section>

            <section className="border-t border-gray-100 pt-8">
              <h2 className="text-2xl font-semibold text-[#1c3053] mb-4">
                26. Contact Us
              </h2>

              <p>
                If you have any questions about these Terms or our website,
                please contact:
              </p>

              <div className="mt-4 bg-gray-50 rounded-2xl p-5 space-y-1">
                <p>
                  <strong>OneKey Estate Agents Limited</strong>
                </p>
                <p>Company number: 17392934</p>
                <p>
                  Netherend Neighbourhood Centre, 13 Mogul Lane, Halesowen,
                  United Kingdom, B63 2QQ
                </p>
                <p>
                  Email:{" "}
                  <a
                    href="mailto:info@onekey.co.uk"
                    className="text-[#ae884e] hover:underline"
                  >
                    info@onekey.co.uk
                  </a>
                </p>
                <p>
                  Telephone: [TELEPHONE NUMBER TO BE CONFIRMED]
                </p>
              </div>

              <p className="mt-4">
                You may also contact us through our{" "}
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