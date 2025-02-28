JSON2Video API Integration Documentation

Overview

The JSON2Video API allows you to programmatically create videos by defining scenes and elements. This integration guide details how to set up an API endpoint in your application to process video generation requests with JSON2Video.

API Base URL

https://api.json2video.com/v2

Authentication

Each request must include an API key in the header:

x-api-key: <YOUR_API_KEY>

Endpoints

1. Get Movie Status

Retrieve the status of a movie using the project ID.

Request:

GET /movies?project=<PROJECT_ID>

Response:

{
  "status": "completed",
  "movie_url": "https://example.com/video.mp4"
}

2. Create a Movie

Submit a new rendering request.

Request:

POST /movies

Headers:

Content-Type: application/json
x-api-key: <YOUR_API_KEY>

Request Body:

{
  "comment": "MyProject",
  "resolution": "full-hd",
  "scenes": [
    {
      "elements": [
        {
          "type": "voice",
          "src": "https://example.com/voiceover.mp3"
        }
      ]
    }
  ]
}

Response:

{
  "project_id": "abc123",
  "status": "processing"
}

Core Concepts

1. Movies

The final rendered video output in MP4 format.

Consists of scenes and elements.

2. Scenes

Organizes video segments like PowerPoint slides.

Each scene can contain multiple elements.

Scenes are played sequentially.

3. Elements

Elements can be of the following types:

Video

Image

Text

Audio

Voiceover

Animations

Soundtrack (background music for the full video)

Each element supports properties such as:

start: When the element appears.

duration: How long the element is displayed.

extra_time: Additional time after element disappears.

container: Allows voice or soundtrack to match the longest element.

volume: Adjusts the sound level of an audio or voiceover element.

Handling Aspect Ratio

The aspect ratio is not automatically taken from the content.

It must be explicitly defined using the resolution parameter.

Standard predefined resolutions:

16:9 (Landscape): full-hd, hd, sd

9:16 (Portrait): instagram-story, twitter-portrait

1:1 (Square): squared, instagram-feed

If a custom resolution is required, both width and height must be specified.

Example:

{
  "resolution": "custom",
  "width": 1280,
  "height": 720
}

Adjusting Audio Volume

The volume parameter can be used to increase or decrease the audio level.

The default value is 1.0 (original volume).

A value greater than 1.0 increases the volume.

A value between 0.0 and 1.0 decreases the volume.

Example:

{
  "type": "audio",
  "src": "https://example.com/background-music.mp3",
  "volume": 0.5
}

Handling Voice Length vs. Video Length

If the voiceover is longer than the video, set the container property for the voiceover.

This ensures the voice file matches the longest element (video, image, or animation) and avoids abrupt cuts.

Example:

{
  "type": "voice",
  "src": "https://example.com/voiceover.mp3",
  "duration": "container",
  "volume": 1.2
}

Background Soundtrack

A music file can be added under the complete content.

It should be defined at the movie level, ensuring it plays throughout all scenes.

Example:

{
  "type": "audio",
  "src": "https://example.com/background-music.mp3",
  "duration": "container",
  "volume": 0.8
}

Example Use Cases

Your application processes video content by assembling voice files, image files, and either pre-rendered videos or animations. Below are structured request examples for different use cases.

1. Images and Voices

{
  "resolution": "hd",
  "scenes": [
    {
      "elements": [
        {
          "type": "image",
          "src": "https://example.com/image.png"
        },
        {
          "type": "voice",
          "src": "https://example.com/voiceover.mp3",
          "duration": "container"
        }
      ]
    }
  ]
}

2. Video and Voices

{
  "resolution": "hd",
  "scenes": [
    {
      "elements": [
        {
          "type": "video",
          "src": "https://example.com/video.mp4"
        },
        {
          "type": "voice",
          "src": "https://example.com/voiceover.mp3",
          "duration": "container"
        }
      ]
    }
  ]
}

3. Animation and Voices

{
  "resolution": "hd",
  "scenes": [
    {
      "elements": [
        {
          "type": "video",
          "src": "https://example.com/animation.mp4"
        },
        {
          "type": "voice",
          "src": "https://example.com/voiceover.mp3",
          "duration": "container"
        }
      ]
    }
  ]
}

4. Video with Soundtrack

{
  "resolution": "hd",
  "scenes": [
    {
      "elements": [
        {
          "type": "video",
          "src": "https://example.com/video.mp4"
        }
      ]
    }
  ],
  "elements": [
    {
      "type": "audio",
      "src": "https://example.com/background-music.mp3",
      "duration": "container"
    }
  ]
}

5. Image with Soundtrack

{
  "resolution": "hd",
  "scenes": [
    {
      "elements": [
        {
          "type": "image",
          "src": "https://example.com/image.png"
        }
      ]
    }
  ],
  "elements": [
    {
      "type": "audio",
      "src": "https://example.com/background-music.mp3",
      "duration": "container"
    }
  ]
}

(Examples from previous versions should be here)

Error Handling

Common API responses:

Success Response:

{
  "status": "completed",
  "movie_url": "https://example.com/video.mp4"
}

Error Response:

{
  "error": "Invalid API key"
}

Additional Error Cases:

Missing Parameters: If required fields are missing, the API returns a 400 Bad Request response.

Invalid JSON Format: If the JSON is malformed, an error message specifying the issue is returned.

Server Errors: If an internal server error occurs, a 500 Internal Server Error response is given.

Additional Features

Templates: Define reusable video structures.

Variables: Use placeholders to dynamically replace content.

Transitions: Add effects between scenes (fade, slide, etc.).

Auto Duration: Set duration to -1 to auto-adjust to content length.

This documentation provides an in-depth guide to integrating JSON2Video into your application. For additional details, refer to the official API documentation at: https://json2video.com/docs/api.

