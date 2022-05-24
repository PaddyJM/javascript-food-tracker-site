import { Stack, StackProps } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import * as cdk from 'aws-cdk-lib'
import {
  Role,
  ServicePrincipal,
  Policy,
  PolicyStatement,
  Effect,
} from 'aws-cdk-lib/aws-iam'

export class FoodTrackerStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props)

    const modelName = 'FoodLogTable'

    const dynamoTable = new cdk.aws_dynamodb.Table(this, modelName, {
      billingMode: cdk.aws_dynamodb.BillingMode.PAY_PER_REQUEST,
      partitionKey: {
        name: `${modelName}Id`,
        type: cdk.aws_dynamodb.AttributeType.STRING,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      tableName: modelName,
    })

    const api = new cdk.aws_apigateway.RestApi(this, `${modelName}Api`, {
      defaultCorsPreflightOptions: {
        allowHeaders: [
          "Content-Type",
          "X-Amz-Date",
          "Authorization",
          "X-Api-Key",
          'Access-Control-Allow-Origin',
          "requestId"
        ],
        allowMethods: ["OPTIONS", "GET", "POST", "PUT", "PATCH", "DELETE"],
        allowCredentials: true,
        allowOrigins: cdk.aws_apigateway.Cors.ALL_ORIGINS,
      },
      restApiName: `${modelName} Service`,
    })

    const allResources = api.root.addResource(modelName.toLocaleLowerCase())

    const oneResource = allResources.addResource('{id}')
    const deletePolicy = new Policy(this, 'deletePolicy', {
      statements: [
        new PolicyStatement({
          actions: ['dynamodb:DeleteItem'],
          effect: Effect.ALLOW,
          resources: [dynamoTable.tableArn],
        }),
      ],
    })

    const getPolicy = new Policy(this, 'getPolicy', {
      statements: [
        new PolicyStatement({
          actions: ['dynamodb:GetItem'],
          effect: Effect.ALLOW,
          resources: [dynamoTable.tableArn],
        }),
      ],
    })

    const putPolicy = new Policy(this, 'putPolicy', {
      statements: [
        new PolicyStatement({
          actions: ['dynamodb:PutItem'],
          effect: Effect.ALLOW,
          resources: [dynamoTable.tableArn],
        }),
      ],
    })

    const scanPolicy = new Policy(this, 'scanPolicy', {
      statements: [
        new PolicyStatement({
          actions: ['dynamodb:Scan'],
          effect: Effect.ALLOW,
          resources: [dynamoTable.tableArn],
        }),
      ],
    })

    const deleteRole = new Role(this, 'deleteRole', {
      assumedBy: new ServicePrincipal('apigateway.amazonaws.com'),
    })
    deleteRole.attachInlinePolicy(deletePolicy)
    const getRole = new Role(this, 'getRole', {
      assumedBy: new ServicePrincipal('apigateway.amazonaws.com'),
    })
    getRole.attachInlinePolicy(getPolicy)
    const putRole = new Role(this, 'putRole', {
      assumedBy: new ServicePrincipal('apigateway.amazonaws.com'),
    })
    putRole.attachInlinePolicy(putPolicy)
    const scanRole = new Role(this, 'scanRole', {
      assumedBy: new ServicePrincipal('apigateway.amazonaws.com'),
    })
    scanRole.attachInlinePolicy(scanPolicy)

    const errorResponses = [
      {
        selectionPattern: '400',
        statusCode: '400',
        responseTemplates: {
          'application/json': `{
            "error": "Bad input!"
          }`,
        },
      },
      {
        selectionPattern: '5\\d{2}',
        statusCode: '500',
        responseTemplates: {
          'application/json': `{
            "error": "Internal Service Error!"
          }`,
        },
      },
    ]

    const integrationResponses: cdk.aws_apigateway.IntegrationResponse[] = [
      {
        statusCode: '200',
        responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': "'*'",
          },
      },
      ...errorResponses,
    ]

    const getAllIntegration = new cdk.aws_apigateway.AwsIntegration({
      action: 'Scan',
      options: {
        credentialsRole: scanRole,
        integrationResponses,
        requestTemplates: {
          'application/json': `{
              "TableName": "${modelName}"
            }`,
        },
      },
      service: 'dynamodb',
    })

    const createIntegration = new cdk.aws_apigateway.AwsIntegration({
      action: 'PutItem',
      options: {
        credentialsRole: putRole,
        integrationResponses: [
          {
            statusCode: '200',
            responseTemplates: {
              'application/json': `{
                "requestId": "$context.requestId"
              }`,
            },
            responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': "'*'",
          },
          },
          ...errorResponses,
        ],
        requestTemplates: {
          'application/json': `{
              "Item": {
                "${modelName}Id": {
                  "S": "$context.requestId"
                },
                "Name": {
                  "S": "$input.path('$.name')"
                },
                "Carbs": {
                  "N": "$input.path('$.carbs')"
                },
                "Protein": {
                  "N": "$input.path('$.protein')"
                },
                "Fat": {
                  "N": "$input.path('$.fat')"
                }
              },
              "TableName": "${modelName}"
            }`,
        },
      },
      service: 'dynamodb',
    })

    const deleteIntegration = new cdk.aws_apigateway.AwsIntegration({
      action: 'DeleteItem',
      options: {
        credentialsRole: deleteRole,
        integrationResponses,
        requestTemplates: {
          'application/json': `{
              "Key": {
                "${modelName}Id": {
                  "S": "$method.request.path.id"
                }
              },
              "TableName": "${modelName}"
            }`,
        },
      },
      service: 'dynamodb',
    })

    const getIntegration = new cdk.aws_apigateway.AwsIntegration({
      action: 'GetItem',
      options: {
        credentialsRole: getRole,
        integrationResponses,
        requestTemplates: {
          'application/json': `{
              "Key": {
                "${modelName}Id": {
                  "S": "$method.request.path.id"
                }
              },
              "TableName": "${modelName}"
            }`,
        },
      },
      service: 'dynamodb',
    })

    const updateIntegration = new cdk.aws_apigateway.AwsIntegration({
      action: 'PutItem',
      options: {
        credentialsRole: putRole,
        integrationResponses,
        requestTemplates: {
          'application/json': `{
              "Item": {
                "${modelName}Id": {
                  "S": "$method.request.path.id"
                },
                "Name": {
                  "S": "$input.path('$.name')"
                },
                "Carbs": {
                  "N": "$input.path('$.carbs')"
                },
                "Protein": {
                  "N": "$input.path('$.protein')"
                },
                "Fat": {
                  "N": "$input.path('$.fat')"
                }
              },
              "TableName": "${modelName}"
            }`,
        },
      },
      service: 'dynamodb',
    })

    const methodOptions: cdk.aws_apigateway.MethodOptions = {
      methodResponses: [
        { statusCode: '200', responseParameters:{
            'method.response.header.Access-Control-Allow-Origin': true,
        } },
        { statusCode: '400' },
        { statusCode: '500' },
      ],
    }

    allResources.addMethod('GET', getAllIntegration, methodOptions)
    allResources.addMethod('POST', createIntegration, methodOptions)

    oneResource.addMethod('DELETE', deleteIntegration, methodOptions)
    oneResource.addMethod('GET', getIntegration, methodOptions)
    oneResource.addMethod('PUT', updateIntegration, methodOptions)
  }
}
