import {
  isPresent,
  isBlank,
  normalizeBool,
  serializeEnum,
  Type,
  RegExpWrapper,
  StringWrapper
} from 'angular2/src/core/facade/lang';
import {StringMapWrapper} from 'angular2/src/core/facade/collection';
import {
  ChangeDetectionStrategy,
  CHANGE_DECTION_STRATEGY_VALUES
} from 'angular2/src/core/change_detection/change_detection';
import {ViewEncapsulation, VIEW_ENCAPSULATION_VALUES} from 'angular2/src/core/render/api';
import {CssSelector} from 'angular2/src/core/render/dom/compiler/selector';
import {splitAtColon} from './util';
import {LifecycleHooks, LIFECYCLE_HOOKS_VALUES} from 'angular2/src/core/compiler/interfaces';

// group 1: "property" from "[property]"
// group 2: "event" from "(event)"
var HOST_REG_EXP = /^(?:(?:\[([^\]]+)\])|(?:\(([^\)]+)\)))$/g;

export class CompileTypeMetadata {
  runtime: Type;
  name: string;
  moduleId: string;
  constructor({runtime, name, moduleId}: {runtime?: Type, name?: string, moduleId?: string} = {}) {
    this.runtime = runtime;
    this.name = name;
    this.moduleId = moduleId;
  }

  static fromJson(data: StringMap<string, any>): CompileTypeMetadata {
    return new CompileTypeMetadata({name: data['name'], moduleId: data['moduleId']});
  }

  toJson(): StringMap<string, any> {
    return {
      // Note: Runtime type can't be serialized...
      'name': this.name,
      'moduleId': this.moduleId
    };
  }
}

export class CompileTemplateMetadata {
  encapsulation: ViewEncapsulation;
  template: string;
  templateUrl: string;
  styles: string[];
  styleUrls: string[];
  ngContentSelectors: string[];
  constructor({encapsulation, template, templateUrl, styles, styleUrls, ngContentSelectors}: {
    encapsulation?: ViewEncapsulation,
    template?: string,
    templateUrl?: string,
    styles?: string[],
    styleUrls?: string[],
    ngContentSelectors?: string[]
  } = {}) {
    this.encapsulation = encapsulation;
    this.template = template;
    this.templateUrl = templateUrl;
    this.styles = isPresent(styles) ? styles : [];
    this.styleUrls = isPresent(styleUrls) ? styleUrls : [];
    this.ngContentSelectors = isPresent(ngContentSelectors) ? ngContentSelectors : [];
  }

  static fromJson(data: StringMap<string, any>): CompileTemplateMetadata {
    return new CompileTemplateMetadata({
      encapsulation: isPresent(data['encapsulation']) ?
                         VIEW_ENCAPSULATION_VALUES[data['encapsulation']] :
                         data['encapsulation'],
      template: data['template'],
      templateUrl: data['templateUrl'],
      styles: data['styles'],
      styleUrls: data['styleUrls'],
      ngContentSelectors: data['ngContentSelectors']
    });
  }

  toJson(): StringMap<string, any> {
    return {
      'encapsulation':
          isPresent(this.encapsulation) ? serializeEnum(this.encapsulation) : this.encapsulation,
      'template': this.template,
      'templateUrl': this.templateUrl,
      'styles': this.styles,
      'styleUrls': this.styleUrls,
      'ngContentSelectors': this.ngContentSelectors
    };
  }
}

export class CompileDirectiveMetadata {
  static create({type, isComponent, dynamicLoadable, selector, exportAs, changeDetection,
                 properties, events, host, lifecycleHooks, template}: {
    type?: CompileTypeMetadata,
    isComponent?: boolean,
    dynamicLoadable?: boolean,
    selector?: string,
    exportAs?: string,
    changeDetection?: ChangeDetectionStrategy,
    properties?: string[],
    events?: string[],
    host?: StringMap<string, string>,
    lifecycleHooks?: LifecycleHooks[],
    template?: CompileTemplateMetadata
  } = {}): CompileDirectiveMetadata {
    var hostListeners = {};
    var hostProperties = {};
    var hostAttributes = {};
    if (isPresent(host)) {
      StringMapWrapper.forEach(host, (value: string, key: string) => {
        var matches = RegExpWrapper.firstMatch(HOST_REG_EXP, key);
        if (isBlank(matches)) {
          hostAttributes[key] = value;
        } else if (isPresent(matches[1])) {
          hostProperties[matches[1]] = value;
        } else if (isPresent(matches[2])) {
          hostListeners[matches[2]] = value;
        }
      });
    }
    var propsMap = {};
    if (isPresent(properties)) {
      properties.forEach((bindConfig: string) => {
        // canonical syntax: `dirProp: elProp`
        // if there is no `:`, use dirProp = elProp
        var parts = splitAtColon(bindConfig, [bindConfig, bindConfig]);
        propsMap[parts[0]] = parts[1];
      });
    }
    var eventsMap = {};
    if (isPresent(events)) {
      events.forEach((bindConfig: string) => {
        // canonical syntax: `dirProp: elProp`
        // if there is no `:`, use dirProp = elProp
        var parts = splitAtColon(bindConfig, [bindConfig, bindConfig]);
        eventsMap[parts[0]] = parts[1];
      });
    }

    return new CompileDirectiveMetadata({
      type: type,
      isComponent: normalizeBool(isComponent),
      dynamicLoadable: normalizeBool(dynamicLoadable),
      selector: selector,
      exportAs: exportAs,
      changeDetection: changeDetection,
      properties: propsMap,
      events: eventsMap,
      hostListeners: hostListeners,
      hostProperties: hostProperties,
      hostAttributes: hostAttributes,
      lifecycleHooks: isPresent(lifecycleHooks) ? lifecycleHooks : [], template: template
    });
  }

  type: CompileTypeMetadata;
  isComponent: boolean;
  dynamicLoadable: boolean;
  selector: string;
  exportAs: string;
  changeDetection: ChangeDetectionStrategy;
  properties: StringMap<string, string>;
  events: StringMap<string, string>;
  hostListeners: StringMap<string, string>;
  hostProperties: StringMap<string, string>;
  hostAttributes: StringMap<string, string>;
  lifecycleHooks: LifecycleHooks[];
  template: CompileTemplateMetadata;
  constructor({type, isComponent, dynamicLoadable, selector, exportAs, changeDetection, properties,
               events, hostListeners, hostProperties, hostAttributes, lifecycleHooks, template}: {
    type?: CompileTypeMetadata,
    isComponent?: boolean,
    dynamicLoadable?: boolean,
    selector?: string,
    exportAs?: string,
    changeDetection?: ChangeDetectionStrategy,
    properties?: StringMap<string, string>,
    events?: StringMap<string, string>,
    hostListeners?: StringMap<string, string>,
    hostProperties?: StringMap<string, string>,
    hostAttributes?: StringMap<string, string>,
    lifecycleHooks?: LifecycleHooks[],
    template?: CompileTemplateMetadata
  } = {}) {
    this.type = type;
    this.isComponent = isComponent;
    this.dynamicLoadable = dynamicLoadable;
    this.selector = selector;
    this.exportAs = exportAs;
    this.changeDetection = changeDetection;
    this.properties = properties;
    this.events = events;
    this.hostListeners = hostListeners;
    this.hostProperties = hostProperties;
    this.hostAttributes = hostAttributes;
    this.lifecycleHooks = lifecycleHooks;
    this.template = template;
  }

  static fromJson(data: StringMap<string, any>): CompileDirectiveMetadata {
    return new CompileDirectiveMetadata({
      isComponent: data['isComponent'],
      dynamicLoadable: data['dynamicLoadable'],
      selector: data['selector'],
      exportAs: data['exportAs'],
      type: isPresent(data['type']) ? CompileTypeMetadata.fromJson(data['type']) : data['type'],
      changeDetection: isPresent(data['changeDetection']) ?
                           CHANGE_DECTION_STRATEGY_VALUES[data['changeDetection']] :
                           data['changeDetection'],
      properties: data['properties'],
      events: data['events'],
      hostListeners: data['hostListeners'],
      hostProperties: data['hostProperties'],
      hostAttributes: data['hostAttributes'],
      lifecycleHooks:
          (<any[]>data['lifecycleHooks']).map(hookValue => LIFECYCLE_HOOKS_VALUES[hookValue]),
      template: isPresent(data['template']) ? CompileTemplateMetadata.fromJson(data['template']) :
                                              data['template']
    });
  }

  toJson(): StringMap<string, any> {
    return {
      'isComponent': this.isComponent,
      'dynamicLoadable': this.dynamicLoadable,
      'selector': this.selector,
      'exportAs': this.exportAs,
      'type': isPresent(this.type) ? this.type.toJson() : this.type,
      'changeDetection': isPresent(this.changeDetection) ? serializeEnum(this.changeDetection) :
                                                           this.changeDetection,
      'properties': this.properties,
      'events': this.events,
      'hostListeners': this.hostListeners,
      'hostProperties': this.hostProperties,
      'hostAttributes': this.hostAttributes,
      'lifecycleHooks': this.lifecycleHooks.map(hook => serializeEnum(hook)),
      'template': isPresent(this.template) ? this.template.toJson() : this.template
    };
  }
}

export function createHostComponentMeta(componentType: CompileTypeMetadata,
                                        componentSelector: string): CompileDirectiveMetadata {
  var template = CssSelector.parse(componentSelector)[0].getMatchingElementTemplate();
  return CompileDirectiveMetadata.create({
    type: new CompileTypeMetadata(
        {runtime: Object, name: `Host${componentType.name}`, moduleId: componentType.moduleId}),
    template: new CompileTemplateMetadata(
        {template: template, templateUrl: '', styles: [], styleUrls: [], ngContentSelectors: []}),
    changeDetection: ChangeDetectionStrategy.Default,
    properties: [],
    events: [],
    host: {},
    lifecycleHooks: [],
    isComponent: true,
    dynamicLoadable: false,
    selector: '*'
  });
}
