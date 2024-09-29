---
title: "System Architecture and Data Flow"
linkTitle: "Architecture"
weight: 2
description: >
  A comprehensive overview of the SHORT-VIDEO-CREATOR-SIMPLIFIED system architecture and data flow.
---

## Overview

This document provides a detailed look at the current architecture of the SHORT-VIDEO-CREATOR-SIMPLIFIED system, including both implemented services and those planned for future development.

## System Architecture Diagram

The following diagram illustrates the data flow and components of our system:

{{< mermaid >}}
graph TD
    A[Client] -->|HTTP Request| B(API Gateway :3000)
    B -->|/api/llm/generate| C[LLM Service :3001]
    B -->|/api/image/generate| D[Image Service :3002]
    B -->|/api/voice/generate| E[Voice Service :3003]
    B -->|/api/animation/generate| F[Animation Service :3004]
    B -->|/api/music/generate| G[Music Service :3005]
    B -->|/api/video/generate| H[Video Service :3006]
    B -->|/api/auth| I[Auth Service :3007]
    B -->|/api/job| J[Job Service :3008]
    B -->|/api/billing| K[Billing Service :3009]
    
    C -->|Response| B
    D -->|Response| B
    E -->|Response| B
    F -->|Response| B
    G -->|Response| B
    H -->|Response| B
    I -->|Response| B
    J -->|Response| B
    K -->|Response| B
    
    B -->|HTTP Response| A

    subgraph API Gateway
        L[Express.js Server]
        M[Axios HTTP Client]
    end

    subgraph "Core Services"
        C
        D
        E
        F
        G
        H
    end

    subgraph "Support Services"
        I
        J
        K
    end

    L -->|Forward Request| M
    M -->|Direct HTTP Request| C
    M -->|Direct HTTP Request| D
    M -->|Direct HTTP Request| E
    M -->|Direct HTTP Request| F
    M -->|Direct HTTP Request| G
    M -->|Direct HTTP Request| H
    M -->|Direct HTTP Request| I
    M -->|Direct HTTP Request| J
    M -->|Direct HTTP Request| K

    classDef implemented fill:#90EE90,stroke:#333,stroke-width:2px;
    classDef inProgress fill:#FFA500,stroke:#333,stroke-width:2px;
    classDef planned fill:#FFB6C1,stroke:#333,stroke-width:2px;
    
    class C,E implemented;
    class D,F,G,H inProgress;
    class I,J,K planned;
{{< /mermaid >}}

## Component Descriptions

### Client
- External application or user interface that sends requests to our system.

### API Gateway (Port 3000)
- Central entry point for all client requests.
- Implemented using Express.js for handling incoming HTTP requests.
- Uses Axios to forward requests directly to the appropriate service.

### Core Services

#### LLM Service (Port 3001)
- **Status: Implemented**
- Handles language model processing tasks.

#### Image Service (Port 3002)
- **Status: In Progress**
- Responsible for image generation.

#### Voice Service (Port 3003)
- **Status: Implemented**
- Manages voice generation tasks.

#### Animation Service (Port 3004)
- **Status: In Progress**
- Handles creation of animations.

#### Music Service (Port 3005)
- **Status: In Progress**
- Generates music for video content.

#### Video Service (Port 3006)
- **Status: In Progress**
- Responsible for video creation and processing.

### Support Services

#### Auth Service (Port 3007)
- **Status: Planned**
- Will handle authentication and authorization.

#### Job Service (Port 3008)
- **Status: Planned**
- Will manage and track content creation jobs.

#### Billing Service (Port 3009)
- **Status: Planned**
- Will handle payments and subscriptions.

## Data Flow

1. The client sends an HTTP request to the API Gateway.
2. The API Gateway receives the request and determines which service should handle it.
3. Using Axios, the API Gateway forwards the request directly to the appropriate service.
4. The service processes the request and sends a response back to the API Gateway.
5. The API Gateway then forwards the response back to the client.

## Implementation Status

- **Implemented (Green)**: LLM Service, Voice Service
- **In Progress (Orange)**: Image Service, Animation Service, Music Service, Video Service
- **Planned (Pink)**: Auth Service, Job Service, Billing Service

## Next Steps

1. Complete the implementation of in-progress services.
2. Begin development of planned support services.
3. Continuously update and refine the API Gateway to support new services.
4. Implement comprehensive testing for all services and the API Gateway.
5. Develop monitoring and logging solutions for the entire system.