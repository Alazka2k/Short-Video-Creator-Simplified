# AceData Midjourney API Documentation

## 1. Overview

This document provides technical documentation for the AceData Midjourney API, which serves as a proxy to the official Midjourney service. It allows for image generation, transformation, and other advanced operations programmatically.

This guide is intended for developers refactoring the `image-service` to replace the existing Puppeteer-based solution.

---

## 2. Authentication

The API uses a Bearer Token for authentication. All requests must include an `Authorization` header.

- **Header**: `Authorization`
- **Value**: `Bearer {YOUR_API_TOKEN}`

---

## 3. Endpoints

The primary endpoint for all image generation and manipulation tasks is:

- **Method**: `POST`
- **URL**: `https://api.acedata.cloud/midjourney/imagine`

### 3.1. Headers

| Header          | Type   | Description                                                                                             | Required |
| :-------------- | :----- | :------------------------------------------------------------------------------------------------------ | :------- |
| `Authorization` | string | Your bearer token for authentication.                                                                   | Yes      |
| `Content-Type`  | string | Must be set to `application/json`.                                                                      | Yes      |
| `accept`        | string | Optional. Set to `application/x-ndjson` to enable [Streaming Responses](#52-streaming-responses).         | No       |

---

## 4. Core Operations (Actions)

The `action` parameter in the request body determines the operation to be performed.

### 4.1. Generate a New Image

This is the initial operation to create an image from a text prompt.

- **Action**: `generate`
- **Description**: Creates a new 2x2 grid of preview images based on the `prompt`.
- **Required Parameters**: `prompt`

#### Example Request Body:
```json
{
  "mode": "fast",
  "action": "generate",
  "prompt": "A futuristic cityscape at sunset, neon lights, high detail, cinematic."
}
```

### 4.2. Operations on an Existing Image

Once an image grid is generated, subsequent operations can be performed on it or its individual sub-images using the `image_id` from the previous response.

| Action               | Description                                                                   | Example       |
| :------------------- | :---------------------------------------------------------------------------- | :------------ |
| `upscale[1-4]`       | Upscales one of the four images in the grid (1=TL, 2=TR, 3=BL, 4=BR).           | `upscale2`    |
| `variation[1-4]`     | Creates four new variations based on one of the four images in the grid.      | `variation3`  |
| `reroll`             | Re-runs the original prompt to generate a new 2x2 grid.                       | `reroll`      |
| `upscale_2x`         | Upscales a single, already-upscaled image by 2x.                              | `upscale_2x`  |
| `upscale_4x`         | Upscales a single, already-upscaled image by 4x.                              | `upscale_4x`  |
| `zoom_out_1_5x`      | Zooms out of a single upscaled image by 1.5x, generating new content around it. | `zoom_out_1_5x` |
| `pan_left` / `right` | Pans the camera on a single upscaled image, generating new content.           | `pan_left`    |
| `variation_region`   | Performs in-painting on a masked region of an upscaled image. See [In-Painting](#54-in-painting-variation_region). | `variation_region` |

#### Example Request Body (Upscale):
```json
{
  "action": "upscale1",
  "image_id": "1234567890123456789" // The image_id from the 'generate' response
}
```

---

## 5. Advanced Features

### 5.1. Asynchronous Webhook Callback

For long-running operations, a webhook can be used to receive results asynchronously instead of waiting for the HTTP response.

- **Parameter**: `callback_url`
- **Usage**: Provide a public URL in the request body. The API will immediately return a `task_id` and send a `POST` request to your URL with the final result upon completion.

#### Example Request Body:
```json
{
  "action": "generate",
  "prompt": "A stoic robot meditating in a zen garden",
  "callback_url": "https://your-service.com/api/midjourney-webhook"
}
```

#### Example Webhook Payload (Success):
```json
{
  "success": true,
  "task_id": "f6e39eaf-652a-4bf5-a15c-79d8b143b80a",
  "image_url": "https://midjourney.cdn.acedata.cloud/.../image.png",
  "image_id": "1234551030549839932",
  "actions": ["upscale1", "upscale2", ...],
  // ...other fields
}
```

#### Example Webhook Payload (Failure):
```json
{
  "success": false,
  "task_id": "7ba0feaf-d20b-4c22-a35a-31ec30fc7715",
  "error": {
    "code": "bad_request",
    "message": "Unrecognized argument(s): `-c`, `x`"
  }
}
```

### 5.2. Streaming Responses

To get real-time progress updates, set the `accept` header to `application/x-ndjson`. The response will be a stream of newline-delimited JSON objects.

- **Header**: `accept: application/x-ndjson`
- **Key Field**: The `progress` field (0-100) indicates the generation status.
- **Note**: The `actions` array will be empty until `progress` reaches 100.

#### Example Streamed Output:
```json
{"progress":35, "image_url":"...", ...}
{"progress":75, "image_url":"...", ...}
{"progress":100, "image_url":"...", "actions":[...], ...}
```

### 5.3. Image Prompts (Image-to-Image / Blending)

To use one or more images as a reference for the prompt, prepend their public URLs to the text prompt string.

- **Parameter**: `prompt`
- **Format**: `"<URL1> <URL2> ... <text prompt> --iw 2"`
- **Note**: `--iw <value>` can be used to control the weight of the image prompt.

#### Example Prompt:
```
"https://cdn.acedata.cloud/teddy.png https://cdn.acedata.cloud/chainsaw.png A bear holding a chainsaw --iw 2"
```

### 5.4. In-Painting (`variation_region`)

This action redraws a specific part of an image.

- **Action**: `variation_region`
- **Required Parameters**:
  - `image_id`: The ID of the single, upscaled source image.
  - `mask`: A **Base64-encoded string** of a grayscale mask image. The mask must be the same dimensions as the source image. White areas indicate the region to be redrawn.
  - `prompt`: A new text prompt describing what to draw in the masked area.

#### Example Request Body:
```json
{
  "action": "variation_region",
  "image_id": "1265875488702726144",
  "prompt": "A cute cat wearing sunglasses",
  "mask": "/9j/4AAQSk... (long base64 string) ...Z/9k="
}
```
---

## 6. API Reference

### 6.1. Request Body Parameters

| Parameter      | Type    | Description                                                                    | Required                 |
| :------------- | :------ | :----------------------------------------------------------------------------- | :----------------------- |
| `action`       | string  | The operation to perform. See [Core Operations](#4-core-operations-actions).   | Yes                      |
| `prompt`       | string  | Text and/or image URLs to generate the image from.                             | Yes, for `generate`      |
| `image_id`     | string  | The ID of an existing image for subsequent operations.                         | Yes, if not `generate`   |
| `mode`         | string  | `fast`, `relax`, or `turbo`. Defaults may apply.                               | No                       |
| `mask`         | string  | Base64 mask for `variation_region` action.                                     | Yes, for `variation_region` |
| `callback_url` | string  | A URL to receive an asynchronous webhook callback with the result.             | No                       |
| `timeout`      | number  | Timeout in seconds for the API call (if not using webhook).                    | No                       |
| `split_images` | boolean | If `true`, splits the 2x2 grid into separate image URLs. Defaults to `false`.    | No                       |
| `translation`  | boolean | If `true`, auto-translates non-English prompts. Defaults to `false`.           | No                       |


### 6.2. Response Body Fields

| Field         | Type     | Description                                                          |
| :------------ | :------- | :------------------------------------------------------------------- |
| `success`     | boolean  | Indicates if the operation was successful.                           |
| `task_id`     | string   | A unique ID for the entire task. Consistent across stream/webhook.   |
| `image_id`    | string   | The unique ID for the generated image artifact. Use for next action. |
| `image_url`   | string   | URL of the generated preview image (or final upscaled image).        |
| `progress`    | number   | The completion percentage of the task (0-100).                       |
| `actions`     | string[] | An array of valid subsequent actions that can be performed.          |
| `error`       | object   | An object containing `code` and `message` on failure.                |

---

## 7. Code Example (Node.js with Axios)

```javascript
import axios from 'axios';

const API_TOKEN = process.env.ACEDATA_API_TOKEN;
const API_URL = 'https://api.acedata.cloud/midjourney/imagine';

async function generateImage(prompt) {
  try {
    const response = await axios.post(
      API_URL,
      {
        action: 'generate',
        prompt: prompt,
        mode: 'fast',
      },
      {
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        timeout: 90000, // 90 second timeout
      }
    );

    if (response.data.success) {
      console.log('Image generation complete!');
      console.log('Image ID:', response.data.image_id);
      console.log('Image URL:', response.data.image_url);
      console.log('Available actions:', response.data.actions);
      return response.data;
    } else {
      console.error('API returned an error:', response.data.error);
      throw new Error(response.data.error.message);
    }
  } catch (error) {
    console.error('Failed to call AceData API:', error.message);
    throw error;
  }
}

// Usage
generateImage('A majestic lion wearing a crown, studio lighting, hyperrealistic')
  .then(data => {
    // Further processing...
  });
```