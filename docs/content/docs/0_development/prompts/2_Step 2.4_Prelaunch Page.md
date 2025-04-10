We are currently working on a complex software project where we now want to create a prelaunch page. 

We already have a frontend implemention under path frontend. 
Here we also have a quite code base already and connection to the backend. Since the development will take some more time, we want to release the prelaunch page already.

We want to hide the existing frontend implementation landing page and also the other pages for different tabs in the header. Same for the footer. In the footer We only want to show the regulatory pages.

But the prelaunch page and adaption should be easily adaptable / revertable again to the final page.

The look and feel should be the same as the existing frontend implementation. But the content should be of course different.

As you can see inside of the mvp plan section ### 2.4. Prelaunch Page Creation and Release we have a detailed plan.

I would like to release the prelaunch page as quickly as possible. I need a guide how to do this when the prelaunch page is ready.

If you need any files or have any questions don´t hesitate to ask.

If I give requirements for a adaption or new implementation, review the existing implementation, create a plan and show me (from a technical perspective, but not necesseraly the code changes you plan to do) what you plan to do. 

Then I review the plan and we discuss any questions if I have. Then you implement the plan.

Please let´s work step after step and do not try to solve all points in one step.

Any questions or can we start?

Here´s also a structural guide how the prelaunch page can look like:
/ (Landing Page)

[ HERO SECTION ]
- Headline: Die Zukunft [deines Problems] beginnt hier.
- Subline: [1-Satz Value Prop mit Vision]
- CTA (Beehiiv): [E-Mail-Feld] [→ Frühzugang sichern]

[ SECTION 1 – DAS PROBLEM ]
- Kurzer Satz: Heute ist [X] schwer.
- Verstärker: Lösungen sind oft [zu teuer | ineffizient | kompliziert].

[ SECTION 2 – UNSERE LÖSUNG ]
- 3 Icons + kurze Benefits (kein Detail, nur Appetithappen)
    - "Automatisch, nicht manuell"
    - "In Minuten statt Stunden"
    - "Intelligent statt starr"

[ SECTION 3 – EARLY ACCESS / SOCIAL PROOF ]
- "Schon über 143 warten auf den Start" (auch fiktiv möglich)
- Mini-FAQ: Wann geht's los? Was passiert mit der E-Mail?

[ SECTION 4 – CALL TO ACTION ]
- Wiederhole CTA
- Footer mit Impressum / Datenschutz

Here is a little guide about the architectural approach:

+------------------------+
                 |  Beehiiv Newsletter    |
                 |  (Embed oder API)      |
                 +----------+-------------+
                            |
                            v
        +------------------ Landing Page ------------------+
        | - Kurze Sections (Hero, USP, Vision, CTA, etc.)  |
        | - Kein Zugang zur App / Login / Registrierung     |
        +--------------------------------------------------+
                            |
                Git: feature/prelaunch-landing
                            |
                            v
        Merge → prelaunch-prod → Deploy auf Hauptdomain
                            |
                            v
               Nach Launch: Merge nach develop/main