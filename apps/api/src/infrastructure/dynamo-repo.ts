import type { Delivery, DeliveryListQuery } from "@smart-logistics/shared";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import type { DeliveryRepository, ListResult } from "../application/ports";

interface DeliveryItem {
  PK: string;
  SK: string;
  gsi1Pk: string;
  gsi1Sk: string;
  gsi2Pk: string;
  gsi2Sk: string;
  gsi3Pk: string;
  gsi3Sk: string;
  trackingCode: string;
  payload: string;
}

function toItem(delivery: Delivery): DeliveryItem {
  return {
    PK: `DELIVERY#${delivery.id}`,
    SK: "META",
    gsi1Pk: `STATUS#${delivery.status}`,
    gsi1Sk: delivery.createdAt,
    gsi2Pk: `CARRIER#${delivery.carrier}`,
    gsi2Sk: delivery.createdAt,
    gsi3Pk: `REGION#${delivery.region}`,
    gsi3Sk: delivery.createdAt,
    trackingCode: delivery.trackingCode,
    payload: JSON.stringify(delivery),
  };
}

function fromItem(item: Record<string, unknown>): Delivery {
  return JSON.parse(item.payload as string) as Delivery;
}

export class DynamoDeliveryRepository implements DeliveryRepository {
  private readonly doc: DynamoDBDocumentClient;

  constructor(
    private readonly tableName: string,
    region: string,
    client?: DynamoDBDocumentClient,
  ) {
    this.doc = client ?? DynamoDBDocumentClient.from(new DynamoDBClient({ region }));
  }

  async getById(id: string): Promise<Delivery | null> {
    const out = await this.doc.send(
      new GetCommand({ TableName: this.tableName, Key: { PK: `DELIVERY#${id}`, SK: "META" } }),
    );
    if (!out.Item) return null;
    return fromItem(out.Item);
  }

  async list(query: DeliveryListQuery): Promise<ListResult> {
    if (query.status) return this.queryByStatus(query);
    if (query.carrier) return this.queryByCarrier(query);
    if (query.q) return this.queryByTracking(query);
    return this.scanAll(query);
  }

  async create(delivery: Delivery): Promise<Delivery> {
    await this.doc.send(new PutCommand({ TableName: this.tableName, Item: toItem(delivery) }));
    return delivery;
  }

  async save(delivery: Delivery): Promise<Delivery> {
    return this.create(delivery);
  }

  async all(): Promise<Delivery[]> {
    const items = await this.scanAll({ page: 1, pageSize: 1000 });
    return items.items;
  }

  private async queryByStatus(query: DeliveryListQuery): Promise<ListResult> {
    const out = await this.doc.send(
      new QueryCommand({
        TableName: this.tableName,
        IndexName: "GSI1",
        KeyConditionExpression: "gsi1Pk = :pk",
        ExpressionAttributeValues: { ":pk": `STATUS#${query.status}` },
        ScanIndexForward: false,
        Limit: query.pageSize,
      }),
    );
    const items = (out.Items ?? []).map(fromItem);
    return { items, total: items.length };
  }

  private async queryByCarrier(query: DeliveryListQuery): Promise<ListResult> {
    const out = await this.doc.send(
      new QueryCommand({
        TableName: this.tableName,
        IndexName: "GSI2",
        KeyConditionExpression: "gsi2Pk = :pk",
        ExpressionAttributeValues: { ":pk": `CARRIER#${query.carrier}` },
        ScanIndexForward: false,
        Limit: query.pageSize,
      }),
    );
    const items = (out.Items ?? []).map(fromItem);
    return { items, total: items.length };
  }

  private async queryByTracking(query: DeliveryListQuery): Promise<ListResult> {
    const out = await this.doc.send(
      new QueryCommand({
        TableName: this.tableName,
        IndexName: "GSI4",
        KeyConditionExpression: "trackingCode = :code",
        ExpressionAttributeValues: { ":code": query.q?.toUpperCase() },
        Limit: query.pageSize,
      }),
    );
    const items = (out.Items ?? []).map(fromItem);
    return { items, total: items.length };
  }

  private async scanAll(query: DeliveryListQuery): Promise<ListResult> {
    const out = await this.doc.send(
      new ScanCommand({
        TableName: this.tableName,
        FilterExpression: "SK = :meta",
        ExpressionAttributeValues: { ":meta": "META" },
        Limit: query.pageSize,
      }),
    );
    const items = (out.Items ?? []).map(fromItem);
    return { items, total: items.length };
  }
}
