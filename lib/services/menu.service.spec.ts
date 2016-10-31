'use strict';
import { Component } from '@angular/core';
import {
  inject,
  async,
  TestBed
} from '@angular/core/testing';

import { MenuService } from './menu.service';
import { Hash } from './hash.service';
import { ScrollService } from './scroll.service';
import { SpecManager } from '../utils/spec-manager';;

describe('Menu service', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ declarations: [ TestAppComponent ] });
  });

  let menu, hashService, scroll;
  let specMgr;

  beforeEach(async(inject([SpecManager, Hash, ScrollService],
  ( _specMgr, _hash, _scroll, _menu) => {
    hashService = _hash;
    scroll = _scroll;

    specMgr = _specMgr;
    return specMgr.load('/tests/schemas/extended-petstore.yml');
  })));

  beforeEach(() => {
    menu = new MenuService(hashService, scroll, specMgr);
    let fixture = TestBed.createComponent(TestAppComponent);
    fixture.detectChanges();
  });

  it('should run hashScroll when hash changed', (done) => {
    spyOn(menu, 'hashScroll').and.callThrough();
    hashService.value.subscribe((hash) => {
      if (!hash) return;
      expect(menu.hashScroll).toHaveBeenCalled();
      menu.hashScroll.and.callThrough();
      done();
    });
    hashService.value.next('nonFalsy');
  });

  it('should scroll to method when location hash is present [jp]', (done) => {
    let hash = '#tag/pet/paths/~1pet~1findByStatus/get';
    spyOn(menu, 'hashScroll').and.callThrough();
    spyOn(window, 'scrollTo').and.stub();
    hashService.value.subscribe((hash) => {
      if (!hash) return;
      expect(menu.hashScroll).toHaveBeenCalled();
      let scrollY = (<jasmine.Spy>window.scrollTo).calls.argsFor(0)[1];
      expect(scrollY).toBeGreaterThan(0);
      (<jasmine.Spy>window.scrollTo).and.callThrough();
      done();
    });
    hashService.value.next(hash);
  });

  it('should scroll to method when location hash is present [operation]', (done) => {
    let hash = '#operation/getPetById';
    spyOn(menu, 'hashScroll').and.callThrough();
    spyOn(window, 'scrollTo').and.stub();
    hashService.value.subscribe((hash) => {
      if (!hash) return;
      expect(menu.hashScroll).toHaveBeenCalled();
      let scrollY = (<jasmine.Spy>window.scrollTo).calls.argsFor(0)[1];
      expect(scrollY).toBeGreaterThan(0);
      done();
    });
    hashService.value.next(hash);
  });

  it('should select next/prev menu item when scrolled down/up', () => {
    scroll.$scrollParent = document.querySelector('#parent');
    menu.activeCatIdx.should.be.equal(0);
    menu.activeMethodIdx.should.be.equal(-1);
    let nextElTop = menu.getRelativeCatOrItem(1).getBoundingClientRect().top;

    scroll.$scrollParent.scrollTop = nextElTop + 1;

    //simulate scroll down
    spyOn(scroll, 'scrollY').and.returnValue(nextElTop + 10);
    menu.scrollUpdate(true);
    menu.activeCatIdx.should.be.equal(1);

    scroll.scrollY.and.returnValue(nextElTop - 2);
    scroll.$scrollParent.scrollTop = nextElTop - 1;
    menu.scrollUpdate(false);
    menu.activeCatIdx.should.be.equal(0);
  });
});

@Component({
  selector: 'test-app',
  template:
      `<div id='parent' style='height: 500px; overflow:auto'>
        <api-info></api-info>
        <methods-list></methods-list>
      </div>`
})
class TestAppComponent {
}
