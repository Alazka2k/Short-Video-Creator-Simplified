Phase 1: Content Details View Implementation
• Open content details e.g.  /api/job/jobs/1760253b-2008-4683-b455-c17bc92d4b73  in new window after response is received
• With validation that only the loggend in user (check the user id of the job entry and compare) shall have access
• Important Required functionalities:
• 1.1. Content preview functionality like a video cutting tool (show all generated content as a flow)
• If a video or animation is generated for a scene we do not need to show the image, only the video or animation from the image initially in the inital view. But somehow it should also possible to see the image as a user (and to recreate it easily)
• Music if generated shall be shown over the complete scenes (above or below) and shall be playable.
• Voice if generated shall be playable. In one piece or all after each other
• 1.2 Enable Content download functionality

Phase 2: Initial Content Workbench Setup and Navigation Flow
• Modify video creation flow to:
• Show loading state while generating (until response is received) but we can also show status of each job as of the logs it should be possible
• Show a new visual feedback that a job is loading and when it is finished in the creation interface
• Keep the form interactive / usable during generation

Phase 3: Content Workbench Overview Implementation
• Enhance existing overview
• Preview of content (images when available)
• Adapt the bento grid size to show the correct aspect ratio of the image
• Quick Download all content

Phase 4: Enhanced Features (from MVP plan)
• 4.1. Content recreation (call to each job with job id, update the job database entry itself after response is received, to always show the latest content), but versionize the job entry itself
• Reason: The user can see then in the job details the amount of recreation and may can choose a older version for the video assembly (complete video creation from the pieces)
• Currently the job table has no versioning yet
• New endpoint might be needed to recreate image + video, or image+ animation (directly both in one step)
• Add content recreation options
• Implement download functionality
• Add transition selection
• Enhance job status tracking


