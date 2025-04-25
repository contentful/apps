import { Field } from './Field';

type FieldDeserializer = (serializedField: any) => Field;

export class FieldRegistry {
  private static registry: Record<string, FieldDeserializer> = {};

  public static registerFieldType(type: string, deserializer: FieldDeserializer): void {
    FieldRegistry.registry[type] = deserializer;
  }

  public static deserializeField(serializedField: any): Field {
    const type = serializedField.type;
    const deserializer = FieldRegistry.registry[type];
    return deserializer(serializedField);
  }
}
