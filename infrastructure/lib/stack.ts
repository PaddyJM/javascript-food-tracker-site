import { Stack, StackProps } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import * as cdk from 'aws-cdk-lib'
import { Role, ServicePrincipal, Policy, PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam'

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
    });

    const getPolicy = new Policy(this, 'getPolicy', {
      statements: [
        new PolicyStatement({
          actions: ['dynamodb:GetItem'],
          effect: Effect.ALLOW,
          resources: [dynamoTable.tableArn],
        }),
      ],
    });

    const putPolicy = new Policy(this, 'putPolicy', {
      statements: [
        new PolicyStatement({
          actions: ['dynamodb:PutItem'],
          effect: Effect.ALLOW,
          resources: [dynamoTable.tableArn],
        }),
      ],
    });

    const scanPolicy = new Policy(this, 'scanPolicy', {
      statements: [
        new PolicyStatement({
          actions: ['dynamodb:Scan'],
          effect: Effect.ALLOW,
          resources: [dynamoTable.tableArn],
        }),
      ],
    });

    const deleteRole = new Role(this, 'deleteRole', {
      assumedBy: new ServicePrincipal('apigateway.amazonaws.com'),
    });
    deleteRole.attachInlinePolicy(deletePolicy);
    const getRole = new Role(this, 'getRole', {
      assumedBy: new ServicePrincipal('apigateway.amazonaws.com'),
    });
    getRole.attachInlinePolicy(getPolicy);
    const putRole = new Role(this, 'putRole', {
      assumedBy: new ServicePrincipal('apigateway.amazonaws.com'),
    });
    putRole.attachInlinePolicy(putPolicy);
    const scanRole = new Role(this, 'scanRole', {
      assumedBy: new ServicePrincipal('apigateway.amazonaws.com'),
    });
    scanRole.attachInlinePolicy(scanPolicy);

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
    ];

    const integrationResponses = [
      {
        statusCode: '200',
      },
      ...errorResponses,
    ];
  }
}
