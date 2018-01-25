import { SharePointQueryable, SharePointQueryableCollection, SharePointQueryableInstance } from "./sharepointqueryable";
import { spODataEntityArray } from "./odata";
import { TypedHash } from "../collections/collections";
import { Util } from "../utils/util";
import {
    XmlSchemaFieldCreationInformation,
    DateTimeFieldFormatType,
    FieldTypes,
    CalendarType,
    UrlFieldFormatType,
} from "./types";

/**
 * Describes a collection of Field objects
 *
 */
export class Fields extends SharePointQueryableCollection {

    /**
     * Creates a new instance of the Fields class
     *
     * @param baseUrl The url or SharePointQueryable which forms the parent of this fields collection
     */
    constructor(baseUrl: string | SharePointQueryable, path = "fields") {
        super(baseUrl, path);
    }

    /**
     * Gets a field from the collection by title
     *
     * @param title The case-sensitive title of the field
     */
    public getByTitle(title: string): Field {
        return new Field(this, `getByTitle('${title}')`);
    }

    /**
     * Gets a field from the collection by using internal name or title
     *
     * @param name The case-sensitive internal name or title of the field
     */
    public getByInternalNameOrTitle(name: string): Field {
        return new Field(this, `getByInternalNameOrTitle('${name}')`);
    }

    /**
     * Gets a list from the collection by guid id
     *
     * @param id The Id of the list
     */
    public getById(id: string): Field {
        const f: Field = new Field(this);
        f.concat(`('${id}')`);
        return f;
    }

    /**
     * Gets a strongly typed array of the Fields with the default properties.
     */
    public getAsFields(): Promise<FieldFull[]> {
        return this.select().getAs(spODataEntityArray(FieldFull));
    }
    
    /**
     * Creates a field based on the specified schema
     */
    public createFieldAsXml(xml: string | XmlSchemaFieldCreationInformation): Promise<FieldAddResult> {

        let info: XmlSchemaFieldCreationInformation;
        if (typeof xml === "string") {
            info = { SchemaXml: xml };
        } else {
            info = xml as XmlSchemaFieldCreationInformation;
        }

        const postBody: string = JSON.stringify({
            "parameters":
                Util.extend({
                    "__metadata":
                        {
                            "type": "SP.XmlSchemaFieldCreationInformation",
                        },
                }, info),
        });

        return this.clone(Fields, "createfieldasxml").postAsCore<{ Id: string }>({ body: postBody }).then((data) => {
            return {
                data: data,
                field: this.getById(data.Id),
            };
        });
    }

    /**
     * Adds a new list to the collection
     *
     * @param title The new field's title
     * @param fieldType The new field's type (ex: SP.FieldText)
     * @param properties Differ by type of field being created (see: https://msdn.microsoft.com/en-us/library/office/dn600182.aspx)
     */
    public add(title: string, fieldType: string, properties: TypedHash<string | number | boolean> = {}): Promise<FieldAddResult> {

        const postBody: string = JSON.stringify(Util.extend({
            "Title": title,
            "__metadata": { "type": fieldType },
        }, properties));

        return this.clone(Fields, null).postAsCore<{ Id: string }>({ body: postBody }).then((data) => {
            return {
                data: data,
                field: this.getById(data.Id),
            };
        });
    }

    /**
     * Adds a new SP.FieldText to the collection
     *
     * @param title The field title
     * @param maxLength The maximum number of characters allowed in the value of the field.
     * @param properties Differ by type of field being created (see: https://msdn.microsoft.com/en-us/library/office/dn600182.aspx)
     */
    public addText(title: string, maxLength = 255, properties?: TypedHash<string | number | boolean>): Promise<FieldAddResult> {

        const props: { FieldTypeKind: number, MaxLength: number } = {
            FieldTypeKind: 2,
            MaxLength: maxLength,
        };

        return this.add(title, "SP.FieldText", Util.extend(props, properties));
    }

    /**
     * Adds a new SP.FieldCalculated to the collection
     *
     * @param title The field title.
     * @param formula The formula for the field.
     * @param dateFormat The date and time format that is displayed in the field.
     * @param outputType Specifies the output format for the field. Represents a FieldType value.
     * @param properties Differ by type of field being created (see: https://msdn.microsoft.com/en-us/library/office/dn600182.aspx)
     */
    public addCalculated(
        title: string,
        formula: string,
        dateFormat: DateTimeFieldFormatType,
        outputType: FieldTypes = FieldTypes.Text,
        properties?: TypedHash<string | number | boolean>): Promise<FieldAddResult> {

        const props: {
            DateFormat: DateTimeFieldFormatType;
            FieldTypeKind: number;
            Formula: string;
            OutputType: FieldTypes;
        } = {
                DateFormat: dateFormat,
                FieldTypeKind: 17,
                Formula: formula,
                OutputType: outputType,
            };

        return this.add(title, "SP.FieldCalculated", Util.extend(props, properties));
    }

    /**
     * Adds a new SP.FieldDateTime to the collection
     *
     * @param title The field title
     * @param displayFormat The format of the date and time that is displayed in the field.
     * @param calendarType Specifies the calendar type of the field.
     * @param properties Differ by type of field being created (see: https://msdn.microsoft.com/en-us/library/office/dn600182.aspx)
     */
    public addDateTime(
        title: string,
        displayFormat: DateTimeFieldFormatType = DateTimeFieldFormatType.DateOnly,
        calendarType: CalendarType = CalendarType.Gregorian,
        friendlyDisplayFormat = 0,
        properties?: TypedHash<string | number | boolean>): Promise<FieldAddResult> {

        const props: {
            DateTimeCalendarType: CalendarType;
            DisplayFormat: DateTimeFieldFormatType;
            FieldTypeKind: number;
            FriendlyDisplayFormat: number;
        } = {
                DateTimeCalendarType: calendarType,
                DisplayFormat: displayFormat,
                FieldTypeKind: 4,
                FriendlyDisplayFormat: friendlyDisplayFormat,
            };

        return this.add(title, "SP.FieldDateTime", Util.extend(props, properties));
    }

    /**
     * Adds a new SP.FieldNumber to the collection
     *
     * @param title The field title
     * @param minValue The field's minimum value
     * @param maxValue The field's maximum value
     * @param properties Differ by type of field being created (see: https://msdn.microsoft.com/en-us/library/office/dn600182.aspx)
     */
    public addNumber(
        title: string,
        minValue?: number,
        maxValue?: number,
        properties?: TypedHash<string | number | boolean>): Promise<FieldAddResult> {

        let props: { FieldTypeKind: number } = { FieldTypeKind: 9 };

        if (typeof minValue !== "undefined") {
            props = Util.extend({ MinimumValue: minValue }, props);
        }

        if (typeof maxValue !== "undefined") {
            props = Util.extend({ MaximumValue: maxValue }, props);
        }

        return this.add(title, "SP.FieldNumber", Util.extend(props, properties));
    }

    /**
     * Adds a new SP.FieldCurrency to the collection
     *
     * @param title The field title
     * @param minValue The field's minimum value
     * @param maxValue The field's maximum value
     * @param currencyLocalId Specifies the language code identifier (LCID) used to format the value of the field
     * @param properties Differ by type of field being created (see: https://msdn.microsoft.com/en-us/library/office/dn600182.aspx)
     */
    public addCurrency(
        title: string,
        minValue?: number,
        maxValue?: number,
        currencyLocalId = 1033,
        properties?: TypedHash<string | number | boolean>): Promise<FieldAddResult> {

        let props: { CurrencyLocaleId: number; FieldTypeKind: number; } = {
            CurrencyLocaleId: currencyLocalId,
            FieldTypeKind: 10,
        };

        if (typeof minValue !== "undefined") {
            props = Util.extend({ MinimumValue: minValue }, props);
        }

        if (typeof maxValue !== "undefined") {
            props = Util.extend({ MaximumValue: maxValue }, props);
        }

        return this.add(title, "SP.FieldCurrency", Util.extend(props, properties));
    }

    /**
     * Adds a new SP.FieldMultiLineText to the collection
     *
     * @param title The field title
     * @param numberOfLines Specifies the number of lines of text to display for the field.
     * @param richText Specifies whether the field supports rich formatting.
     * @param restrictedMode Specifies whether the field supports a subset of rich formatting.
     * @param appendOnly Specifies whether all changes to the value of the field are displayed in list forms.
     * @param allowHyperlink Specifies whether a hyperlink is allowed as a value of the field.
     * @param properties Differ by type of field being created (see: https://msdn.microsoft.com/en-us/library/office/dn600182.aspx)
     *
     */
    public addMultilineText(
        title: string,
        numberOfLines = 6,
        richText = true,
        restrictedMode = false,
        appendOnly = false,
        allowHyperlink = true,
        properties?: TypedHash<string | number | boolean>): Promise<FieldAddResult> {

        const props: {
            AllowHyperlink: boolean;
            AppendOnly: boolean;
            FieldTypeKind: number;
            NumberOfLines: number;
            RestrictedMode: boolean;
            RichText: boolean;
        } = {
                AllowHyperlink: allowHyperlink,
                AppendOnly: appendOnly,
                FieldTypeKind: 3,
                NumberOfLines: numberOfLines,
                RestrictedMode: restrictedMode,
                RichText: richText,
            };

        return this.add(title, "SP.FieldMultiLineText", Util.extend(props, properties));
    }

    /**
     * Adds a new SP.FieldUrl to the collection
     *
     * @param title The field title
     */
    public addUrl(
        title: string,
        displayFormat: UrlFieldFormatType = UrlFieldFormatType.Hyperlink,
        properties?: TypedHash<string | number | boolean>,
    ): Promise<FieldAddResult> {

        const props: { DisplayFormat: UrlFieldFormatType; FieldTypeKind: number } = {
            DisplayFormat: displayFormat,
            FieldTypeKind: 11,
        };

        return this.add(title, "SP.FieldUrl", Util.extend(props, properties));
    }
}

/**
 * Describes a single of Field instance
 *
 */
export class Field extends SharePointQueryableInstance {

    /**
     * Updates this field intance with the supplied properties
     *
     * @param properties A plain object hash of values to update for the list
     * @param fieldType The type value, required to update child field type properties
     */
    public update(properties: TypedHash<string | number | boolean>, fieldType = "SP.Field"): Promise<FieldUpdateResult> {

        const postBody: string = JSON.stringify(Util.extend({
            "__metadata": { "type": fieldType },
        }, properties));

        return this.postCore({
            body: postBody,
            headers: {
                "X-HTTP-Method": "MERGE",
            },
        }).then((data) => {
            return {
                data: data,
                field: this,
            };
        });
    }

    /**
     * Delete this fields
     *
     */
    public delete(): Promise<void> {
        return this.postCore({
            headers: {
                "X-HTTP-Method": "DELETE",
            },
        });
    }

    /**
     * Sets the value of the ShowInDisplayForm property for this field.
     */
    public setShowInDisplayForm(show: boolean): Promise<void> {
        return this.clone(Field, `setshowindisplayform(${show})`).postCore();
    }

    /**
     * Sets the value of the ShowInEditForm property for this field.
     */
    public setShowInEditForm(show: boolean): Promise<void> {
        return this.clone(Field, `setshowineditform(${show})`).postCore();
    }

    /**
     * Sets the value of the ShowInNewForm property for this field.
     */
    public setShowInNewForm(show: boolean): Promise<void> {
        return this.clone(Field, `setshowinnewform(${show})`).postCore();
    }
}

/**
 * This interface defines the result of adding a field
 */
export interface FieldAddResult {
    data: any;
    field: Field;
}

export interface FieldUpdateResult {
    data: any;
    field: Field;
}

// https://msdn.microsoft.com/en-us/library/office/dn600182.aspx#bk_Field
export class FieldFull extends Field implements FieldAddResult, FieldUpdateResult {
    data: FieldFull;
    field: FieldFull;

    constructor(baseUrl: string | SharePointQueryable, path?: string) {
        super(baseUrl, path);
        this.data = this;
        this.field = this;
    }

    /** Gets a value that specifies whether the field can be deleted. */
    CanBeDeleted: boolean;
    /** Gets or sets a value that specifies the default value for the field. */
    DefaultValue: string;
    /** Gets or sets a value that specifies the description of the field. */
    Description: string;
    /** Gets or sets a value that specifies the reading order of the field. */
    Direction: string;
    /** Gets or sets a value that specifies whether to require unique field values in a list or library column. */
    EnforceUniqueValues: boolean;
    /** Gets the name of the entity property for the list item entity that uses this field. */
    EntityPropertyName: string;
    /** Gets or sets a value that specifies the type of the field. Represents a FieldType value. See FieldType in the .NET client object model reference for a list of field type values. */
    FieldTypeKind: number;
    /** Gets a value that specifies whether list items in the list can be filtered by the field value. */
    Filterable: boolean;
    /** Gets a boolean value that indicates whether the field derives from a base field type. */
    FromBaseType: boolean;
    /** Gets or sets a value that specifies the field group. */
    Group: string;
    /** Gets or sets a value that specifies whether the field is hidden in list views and list forms. */
    Hidden: boolean;
    /** Gets a value that specifies the field identifier. */
    Id: string;
    /** Gets or sets a boolean value that specifies whether the field is indexed. */
    Indexed: boolean;
    /** Gets a value that specifies the field internal name. */
    InternalName: string;
    /** Gets or sets the name of an external JS file containing any client rendering logic for fields of this type. */
    JSLink: string;
    /** Gets or sets a value that specifies whether the value of the field is read-only. */
    ReadOnlyField: boolean;
    /** Gets or sets a value that specifies whether the field requires a value. */
    Required: boolean;
    /** Gets or sets a value that specifies the XML schema that defines the field. */
    SchemaXml: string;
    /** Gets the schema that defines the field and includes resource tokens. */
    SchemaXmlWithResourceTokens: string;
    /** Gets a value that specifies the server-relative URL of the list or the site to which the field belongs. */
    Scope: string;
    /** Gets a value that specifies whether properties on the field cannot be changed and whether the field cannot be deleted. */
    Sealed: boolean;
    /** Gets a value that specifies whether list items in the list can be sorted by the field value. */
    Sortable: boolean;
    /** Gets or sets a value that specifies a customizable identifier of the field. */
    StaticName: string;
    /** Gets or sets value that specifies the display name of the field. */
    Title: string;
    /** Gets or sets a value that specifies the type of the field. */
    TypeAsstring: string;
    /** Gets a value that specifies the display name for the type of the field. */
    TypeDisplayName: string;
    /** Gets a value that specifies the description for the type of the field. */
    TypeShortDescription: string;
    /** Gets or sets a value that specifies the data validation criteria for the value of the field. */
    ValidationFormula: string;
    /** Gets or sets a value that specifies the error message returned when data validation fails for the field. */
    ValidationMessage: string;
}