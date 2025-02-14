# For each camera option we need a dedicated definition which are possible and which are not possible. We don´t always need to add a camera option to the prompt.

## Possible options:
- 1. Similar to the llm examples we create a table for it with camera options and ids for each. The database is then checked and a camera option for the video is added to the prompt
- 2. We add a json mapping for the camera options

## Camera options:
"Static","Move Left","Move Right","Move Up","Move Down","Push In","Pull Out","Zoom In","Zoom Out","Pan Left","Pan Right","Orbit Left","Orbit Right","Crane Up","Crane Down"
