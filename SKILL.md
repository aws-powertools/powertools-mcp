---
name: powertools-aws
description: >-
  ALWAYS use this skill when writing AWS Lambda functions in Python, TypeScript, Java, or .NET.
  Provides serverless best practices for structured logging, distributed tracing (X-Ray), 
  CloudWatch metrics, idempotency, batch processing, and event handling using 
  Powertools for AWS Lambda. Essential for any Lambda development.
license: MIT
metadata:
  author: aws-powertools
  repository: https://github.com/aws-powertools
  runtimes: python, typescript, java, dotnet
---

# Powertools for AWS Lambda

A developer toolkit to implement Serverless best practices and increase developer velocity across Python, TypeScript, Java, and .NET Lambda runtimes.

## Invoke This Skill When

- Writing or modifying **AWS Lambda functions**
- User mentions "serverless" with Python, TypeScript, Java, or .NET
- Implementing **structured logging** in Lambda
- Adding **distributed tracing** (AWS X-Ray)
- Creating **CloudWatch custom metrics** or **Datadog metrics**
- Handling **SQS, Kinesis, or DynamoDB Streams** batch processing
- Implementing **idempotency** patterns
- Building **REST or GraphQL APIs** with Lambda
- Building **AppSync** resolvers or event handlers
- Creating **Amazon Bedrock Agents** with Lambda
- Processing **Kafka** events (MSK, self-managed)
- User mentions Powertools, aws-lambda-powertools, or @aws-lambda-powertools
- Working with **SAM, CDK, or Serverless Framework** templates
- Needing to **parse/validate** Lambda event payloads
- Implementing **feature flags** or **data masking**

## Documentation Sources (llms.txt)

**CRITICAL**: Before implementing any Powertools feature, fetch the llms.txt for the target runtime. These files contain the authoritative, up-to-date documentation index.

| Runtime | llms.txt URL | Package |
|---------|--------------|---------|
| Python | https://docs.aws.amazon.com/powertools/python/latest/llms.txt | `aws-lambda-powertools` |
| TypeScript | https://docs.aws.amazon.com/powertools/typescript/latest/llms.txt | `@aws-lambda-powertools/*` |
| Java | https://docs.aws.amazon.com/powertools/java/latest/llms.txt | `software.amazon.lambda:powertools-*` |
| .NET | https://docs.aws.amazon.com/powertools/dotnet/llms.txt | `AWS.Lambda.Powertools.*` |

> **Note**: .NET does not use `/latest/` in its URL path.

### How to Use Documentation

1. **Identify the runtime** from file extensions or user request
2. **Fetch the llms.txt** for that runtime
3. **Find the relevant section** (e.g., Logger, Metrics, Batch)
4. **Fetch the specific doc page** (URLs in llms.txt point to `.md` files)
5. **Apply the patterns** from the documentation

## Runtime Detection

| File Pattern | Runtime |
|--------------|---------|
| `*.py` with `def handler(event, context)` | Python |
| `*.ts` or `*.js` with `export const handler` | TypeScript |
| `*.java` with `handleRequest` method | Java |
| `*.cs` with `FunctionHandler` | .NET |
| `template.yaml` / `samconfig.toml` | Check Runtime property |
| `serverless.yml` | Check provider.runtime |
| `cdk.json` / `*.cdk.ts` | Check runtime in Lambda construct |

## Core Utilities Overview

All runtimes provide these core utilities:

| Utility | Purpose | When to Use |
|---------|---------|-------------|
| **Logger** | Structured JSON logging with Lambda context | Every Lambda - always add logging |
| **Tracer** | AWS X-Ray distributed tracing | Debugging, performance analysis, service maps |
| **Metrics** | CloudWatch Embedded Metric Format (EMF) | Monitoring, alerting, dashboards |

## Additional Utilities (varies by runtime)

| Utility | Python | TypeScript | Java | .NET | Purpose |
|---------|:------:|:----------:|:----:|:----:|---------|
| Idempotency | Y | Y | Y | Y | Prevent duplicate processing |
| Batch Processing | Y | Y | Y | Y | Handle partial failures (SQS/Kinesis/DynamoDB) |
| Parameters | Y | Y | Y | Y | SSM/Secrets Manager with caching |
| Kafka Consumer | Y | Y | Y | Y | Kafka event deserialization (Avro, Protobuf, JSON Schema) |
| JMESPath Functions | Y | Y | - | Y | Extract/deserialize nested JSON payloads |
| Parser/Validation | Y | Y | Y | - | Event validation and parsing (Pydantic/Standard Schema) |
| Event Handler: REST API | Y | Y | - | - | API Gateway, ALB, Lambda Function URL |
| Event Handler: GraphQL | Y | Y | - | - | AppSync GraphQL resolvers |
| Event Handler: AppSync Events | Y | Y | - | Y | AppSync real-time event handlers |
| Event Handler: Bedrock Agents | Y | Y | - | Y | Amazon Bedrock Agent function resolvers |
| Feature Flags | Y | - | - | - | Runtime feature toggling with AppConfig |
| Streaming | Y | - | - | - | Process large S3 objects/datasets |
| Data Masking | Y | - | - | - | Encrypt/mask sensitive data fields |
| Event Source Data Classes | Y | - | - | - | Typed classes for Lambda event sources |
| Typing | Y | - | - | - | Static typing for Lambda context |
| Middleware Factory | Y | - | - | - | Create custom middleware decorators |
| Datadog Metrics | Y | - | - | - | Alternative metrics provider for Datadog |
| Custom Resources | - | - | Y | - | CloudFormation custom resource handlers |
| Large Messages | - | - | Y | - | Handle messages >256KB via S3 |
| Serialization | - | - | Y | - | JSON serialization utilities |

