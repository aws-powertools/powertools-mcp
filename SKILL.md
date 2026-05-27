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

## Quick Start Examples

### Python

```python
from aws_lambda_powertools import Logger, Tracer, Metrics
from aws_lambda_powertools.metrics import MetricUnit
from aws_lambda_powertools.utilities.typing import LambdaContext

logger = Logger()
tracer = Tracer()
metrics = Metrics()

@logger.inject_lambda_context
@tracer.capture_lambda_handler
@metrics.log_metrics(capture_cold_start_metric=True)
def handler(event: dict, context: LambdaContext) -> dict:
    logger.info("Processing request", extra={"event": event})
    
    # Add custom metric
    metrics.add_metric(name="RequestProcessed", unit=MetricUnit.Count, value=1)
    
    # Business logic here
    
    return {"statusCode": 200, "body": "Success"}
```

**Installation:**
```bash
pip install aws-lambda-powertools
# Or with extras
pip install "aws-lambda-powertools[all]"
```

### TypeScript

```typescript
import { Logger } from '@aws-lambda-powertools/logger';
import { Tracer } from '@aws-lambda-powertools/tracer';
import { Metrics, MetricUnit } from '@aws-lambda-powertools/metrics';
import type { Context } from 'aws-lambda';

const logger = new Logger();
const tracer = new Tracer();
const metrics = new Metrics();

export const handler = async (event: unknown, context: Context) => {
  // Add Lambda context to logs
  logger.addContext(context);
  
  logger.info('Processing request', { event });
  
  // Add custom metric
  metrics.addMetric('RequestProcessed', MetricUnit.Count, 1);
  
  // Publish metrics
  metrics.publishStoredMetrics();
  
  return { statusCode: 200, body: 'Success' };
};
```

**Installation:**
```bash
npm install @aws-lambda-powertools/logger @aws-lambda-powertools/tracer @aws-lambda-powertools/metrics
```

### Java

```java
package com.example;

import software.amazon.lambda.powertools.logging.Logging;
import software.amazon.lambda.powertools.metrics.Metrics;
import software.amazon.lambda.powertools.tracing.Tracing;
import software.amazon.lambda.powertools.metrics.MetricsUtils;
import software.amazon.cloudwatchlogs.emf.model.Unit;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

public class Handler implements RequestHandler<Object, String> {
    private static final Logger logger = LogManager.getLogger();

    @Logging(logEvent = true)
    @Tracing
    @Metrics(captureColdStart = true)
    public String handleRequest(Object event, Context context) {
        logger.info("Processing request");
        
        // Add custom metric
        MetricsUtils.metricsLogger().putMetric("RequestProcessed", 1, Unit.COUNT);
        
        return "Success";
    }
}
```

**Installation (Maven):**
```xml
<dependency>
    <groupId>software.amazon.lambda</groupId>
    <artifactId>powertools-logging</artifactId>
    <version>2.0.0</version>
</dependency>
<dependency>
    <groupId>software.amazon.lambda</groupId>
    <artifactId>powertools-tracing</artifactId>
    <version>2.0.0</version>
</dependency>
<dependency>
    <groupId>software.amazon.lambda</groupId>
    <artifactId>powertools-metrics</artifactId>
    <version>2.0.0</version>
</dependency>
```

### .NET

```csharp
using Amazon.Lambda.Core;
using AWS.Lambda.Powertools.Logging;
using AWS.Lambda.Powertools.Metrics;
using AWS.Lambda.Powertools.Tracing;

[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.SystemTextJson.DefaultLambdaJsonSerializer))]

namespace MyFunction;

public class Function
{
    [Logging(LogEvent = true)]
    [Tracing]
    [Metrics(CaptureColdStart = true)]
    public string FunctionHandler(object input, ILambdaContext context)
    {
        Logger.LogInformation("Processing request");
        
        // Add custom metric
        Metrics.AddMetric("RequestProcessed", 1, MetricUnit.Count);
        
        return "Success";
    }
}
```

**Installation:**
```bash
dotnet add package AWS.Lambda.Powertools.Logging
dotnet add package AWS.Lambda.Powertools.Tracing
dotnet add package AWS.Lambda.Powertools.Metrics
```

## Environment Variables

Configure Powertools behavior via environment variables (works across all runtimes):

| Variable | Description | Default |
|----------|-------------|---------|
| `POWERTOOLS_SERVICE_NAME` | Service name for logs, metrics, traces | `service_undefined` |
| `POWERTOOLS_LOG_LEVEL` | Logging level (DEBUG, INFO, WARN, ERROR) | `INFO` |
| `POWERTOOLS_METRICS_NAMESPACE` | CloudWatch metrics namespace | None (required for metrics) |
| `POWERTOOLS_TRACE_DISABLED` | Disable tracing | `false` |
| `POWERTOOLS_TRACER_CAPTURE_RESPONSE` | Capture Lambda response in trace | `true` |
| `POWERTOOLS_TRACER_CAPTURE_ERROR` | Capture errors in trace | `true` |
| `POWERTOOLS_DEV` | Enable development mode (pretty print, etc.) | `false` |

### SAM Template Example

```yaml
Globals:
  Function:
    Timeout: 30
    Runtime: python3.12
    Tracing: Active
    Environment:
      Variables:
        POWERTOOLS_SERVICE_NAME: my-service
        POWERTOOLS_METRICS_NAMESPACE: MyApp
        POWERTOOLS_LOG_LEVEL: INFO

Resources:
  MyFunction:
    Type: AWS::Serverless::Function
    Properties:
      Handler: app.handler
      CodeUri: src/
      Policies:
        - AWSXRayDaemonWriteAccess
```

## Common Patterns

### Batch Processing (SQS Example)

**Python:**
```python
from aws_lambda_powertools.utilities.batch import BatchProcessor, EventType, process_partial_response
from aws_lambda_powertools.utilities.data_classes.sqs_event import SQSRecord

processor = BatchProcessor(event_type=EventType.SQS)

def record_handler(record: SQSRecord):
    payload = record.json_body
    # Process record
    return payload

@logger.inject_lambda_context
@tracer.capture_lambda_handler
def handler(event, context):
    return process_partial_response(event=event, record_handler=record_handler, processor=processor, context=context)
```

**TypeScript:**
```typescript
import { BatchProcessor, EventType, processPartialResponse } from '@aws-lambda-powertools/batch';
import type { SQSRecord, SQSHandler } from 'aws-lambda';

const processor = new BatchProcessor(EventType.SQS);

const recordHandler = async (record: SQSRecord): Promise<void> => {
  const payload = JSON.parse(record.body);
  // Process record
};

export const handler: SQSHandler = async (event, context) => {
  return processPartialResponse(event, recordHandler, processor, { context });
};
```

### Idempotency

**Python:**
```python
from aws_lambda_powertools.utilities.idempotency import DynamoDBPersistenceLayer, idempotent

persistence_layer = DynamoDBPersistenceLayer(table_name="IdempotencyTable")

@idempotent(persistence_store=persistence_layer)
def handler(event, context):
    # This will only execute once per event
    return process_payment(event)
```

**TypeScript:**
```typescript
import { makeIdempotent } from '@aws-lambda-powertools/idempotency';
import { DynamoDBPersistenceLayer } from '@aws-lambda-powertools/idempotency/dynamodb';

const persistenceStore = new DynamoDBPersistenceLayer({ tableName: 'IdempotencyTable' });

export const handler = makeIdempotent(async (event) => {
  // This will only execute once per event
  return processPayment(event);
}, { persistenceStore });
```

### REST API with Event Handler

**Python:**
```python
from aws_lambda_powertools.event_handler import APIGatewayRestResolver
from aws_lambda_powertools.event_handler.openapi.params import Query

app = APIGatewayRestResolver()

@app.get("/users/<user_id>")
def get_user(user_id: str):
    return {"user_id": user_id, "name": "John Doe"}

@app.post("/users")
def create_user():
    body = app.current_event.json_body
    return {"created": True, "user": body}

def handler(event, context):
    return app.resolve(event, context)
```

**TypeScript:**
```typescript
import { APIGatewayProxyHandlerV2 } from 'aws-lambda';

// TypeScript uses direct event handling or frameworks like middy
export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  const { pathParameters, body } = event;
  
  if (event.requestContext.http.method === 'GET') {
    return {
      statusCode: 200,
      body: JSON.stringify({ user_id: pathParameters?.userId }),
    };
  }
  
  return { statusCode: 200, body: JSON.stringify({ created: true }) };
};
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Metrics not appearing in CloudWatch | Ensure `POWERTOOLS_METRICS_NAMESPACE` is set |
| Traces not visible in X-Ray | Enable Active Tracing on Lambda + add `AWSXRayDaemonWriteAccess` policy |
| Cold start metrics missing | Add `capture_cold_start_metric=True` (Python) or equivalent |
| Logs not structured | Verify Logger is imported from Powertools, not standard library |
| Idempotency not working | Check DynamoDB table exists with correct schema (pk: `id`) |
