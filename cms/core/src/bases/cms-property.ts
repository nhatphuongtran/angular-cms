import { Input, Injectable, ComponentFactoryResolver, ViewContainerRef, ComponentRef, InjectionToken } from '@angular/core';
import { FormGroup } from '@angular/forms';

import { generateUUID } from '../helpers/common';
import { CMS } from '../cms';
import { PropertyMetadata } from '../decorators/property.decorator';

export abstract class CmsProperty {
    id: string = this.getId();
    @Input() label: string;
    @Input() propertyName: string;
    @Input() formGroup: FormGroup;

    protected getId(id: number | string = generateUUID()): string {
        return this.constructor.name + '_' + id;
    }
}

export const PROPERTY_PROVIDERS_TOKEN: InjectionToken<CmsPropertyFactory[]> = new InjectionToken<CmsPropertyFactory[]>('PROPERTY_PROVIDERS_TOKEN');

export function getCmsPropertyFactory(propertyKey: string) {
    return (componentFactoryResolver: ComponentFactoryResolver): CmsPropertyFactory => {
        return new CmsPropertyFactory(componentFactoryResolver, propertyKey)
    };
};

@Injectable()
export class CmsPropertyFactory {
    protected propertyKey: string;
    componentFactoryResolver: ComponentFactoryResolver;

    constructor(componentFactoryResolver: ComponentFactoryResolver, propertyKey: string) {
        this.componentFactoryResolver = componentFactoryResolver;
        this.propertyKey = propertyKey;
    }

    isMatching(propertyKey): boolean {
        return this.propertyKey == propertyKey;
    }

    createCmsPropertyComponent(viewContainerRef: ViewContainerRef, formGroup: FormGroup, propertyName: string, propertyMetadata: PropertyMetadata): ComponentRef<any> {
        return this.createDefaultCmsPropertyComponent(viewContainerRef, formGroup, propertyName, propertyMetadata);
    }

    protected createDefaultCmsPropertyComponent(viewContainerRef: ViewContainerRef, formGroup: FormGroup, propertyName: string, propertyMetadata: PropertyMetadata): ComponentRef<any> {
        const propertyFactory = this.componentFactoryResolver.resolveComponentFactory(CMS.PROPERTIES[propertyMetadata.displayType]);
        const propertyComponent = viewContainerRef.createComponent(propertyFactory);

        (<CmsProperty>propertyComponent.instance).label = propertyMetadata.displayName;
        (<CmsProperty>propertyComponent.instance).formGroup = formGroup;
        (<CmsProperty>propertyComponent.instance).propertyName = propertyName;

        return propertyComponent;
    }
}