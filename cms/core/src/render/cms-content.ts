import { Component, ComponentFactoryResolver, Inject, ViewChild, OnDestroy, ComponentRef } from '@angular/core';
import { Router } from '@angular/router';
import 'reflect-metadata';

import { PAGE_TYPE_METADATA_KEY, PROPERTIES_METADATA_KEY, PROPERTY_METADATA_KEY } from '../constants/meta-keys';
import { PageService } from './../services/page.service';
import { InsertPointDirective } from './../directives/insert-point.directive';

import { CMS } from './../cms';
import { PageData } from './../bases/page-data';
import { CmsComponent } from './../bases/cms-component';
import { PropertyMetadata } from '../decorators/property.decorator';
import { Page } from '../models/page.model';
import { clone } from '../helpers/common';
import { UIHint } from '../constants/ui-hint';
import { ContentTypeMetadata } from '../decorators/content-type-metadata';

@Component({
    selector: 'cms-content',
    template: `<ng-template cmsInsertPoint></ng-template>`
})
export class CmsRenderContentComponent implements OnDestroy {

    private pageComponentRef: ComponentRef<any>;

    @ViewChild(InsertPointDirective, { static: true }) pageEditHost: InsertPointDirective;

    constructor(
        private componentFactoryResolver: ComponentFactoryResolver,
        private pageService: PageService,
        private router: Router) { }

    ngOnInit() {
        // this.router.events.subscribe((event) => {
        //     if (event.constructor.name === "NavigationEnd") {
        //         console.log(window.location.pathname);
        //         this.resolveContentDataByUrl();
        //     }
        // });
        this.resolveContentDataByUrl();
    }

    ngOnDestroy() {
        if (this.pageComponentRef) {
            this.pageComponentRef.destroy();
        }
    }

    private resolveContentDataByUrl() {
        const currentUrl = window.location.href;
        this.pageService.getPublishedPage(currentUrl).subscribe((currentPage: Page) => {
            if (currentPage) {
                const contentType = CMS.PAGE_TYPES[currentPage.contentType];
                const pageMetadata = Reflect.getMetadata(PAGE_TYPE_METADATA_KEY, contentType);
                const propertiesMetadata = this.getPropertiesMetadata(contentType);
                propertiesMetadata.forEach(property => this.populateReferenceProperty(currentPage, property))
                this.createPageComponent(currentPage.properties, pageMetadata);
            }
        })
    }

    private getPropertiesMetadata(contentType: string): { name: string, metadata: PropertyMetadata }[] {
        const properties: Array<string> = Reflect.getMetadata(PROPERTIES_METADATA_KEY, contentType);
        return properties.map(propertyName => ({ name: propertyName, metadata: Reflect.getMetadata(PROPERTY_METADATA_KEY, contentType, propertyName) }))
    }

    private populateReferenceProperty(currentPage: Page, property: { name: string, metadata: PropertyMetadata }): void {
        if (!currentPage.properties) return;

        const childItems = currentPage.publishedChildItems;
        const fieldType = property.metadata.displayType;
        switch (fieldType) {
            case UIHint.ContentArea:
                const fieldValue = currentPage.properties[property.name]
                if (Array.isArray(fieldValue)) {
                    for (let i = 0; i < fieldValue.length; i++) {
                        const matchItem = childItems.find(x => x.content && x.content._id == fieldValue[i]._id);
                        if (matchItem) {
                            fieldValue[i] = clone(matchItem.content);
                        }
                    }
                    currentPage.properties[property.name] = fieldValue;
                }
                break;
        }
    }

    private createPageComponent(content, pageMetadata: ContentTypeMetadata) {
        if (pageMetadata) {
            const viewContainerRef = this.pageEditHost.viewContainerRef;
            viewContainerRef.clear();

            const pageFactory = this.componentFactoryResolver.resolveComponentFactory(pageMetadata.componentRef);
            this.pageComponentRef = viewContainerRef.createComponent(pageFactory);
            (<CmsComponent<PageData>>this.pageComponentRef.instance).currentContent = content;
        }
    }
}