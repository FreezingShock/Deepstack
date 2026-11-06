import test from 'node:test';
import assert from 'node:assert/strict';
import {alcoveFit, wantRow, FRAME, FOOT} from '../src/world/alcoveFit.js';

const SIZES = [[320, 568], [375, 667], [414, 896], [568, 320], [667, 375], [800, 600], [900, 420], [1024, 768], [1280, 500], [1280, 720], [1440, 900], [1920, 1080], [2560, 1440], [3840, 2160]];

test('alcove is centred with half a row of books above and below, at every size', () => {
  for (const [, H] of SIZES) for (const bar of [52, 52 + 47]) {
    const BM = 14, f = alcoveFit(H, bar, BM), base = H - BM - FOOT;
    const above = f.top - FRAME - bar, below = base - (f.bottom + FRAME);
    assert.ok(Math.abs(above - f.RH / 2) < .01, `${H}: half a row above (${above} vs ${f.RH / 2})`);
    assert.ok(Math.abs(below - f.RH / 2) < .01, `${H}: half a row below (${below} vs ${f.RH / 2})`);
    assert.ok(Math.abs(above - below) < .01, `${H}: equal bands`);
  }
});

test('shelf planks line up: the plank above the alcove is a whole number of rows from the one under it', () => {
  for (const [, H] of SIZES) {
    const bar = 52, BM = 14, f = alcoveFit(H, bar, BM), base = H - BM - FOOT;
    const rows = (base - (f.top - FRAME)) / f.RH;
    assert.ok(Math.abs(rows - Math.round(rows)) < 1e-6, `${H}: ${rows} rows`);
  }
});

test('row height stays near the natural one and the alcove keeps its height', () => {
  for (const [, H] of SIZES) {
    const f = alcoveFit(H, 52, 14), want = wantRow(H);
    assert.ok(f.RH >= 64 && f.RH <= 190, `${H}: RH ${f.RH}`);
    assert.ok(f.RH / want < 1.35 && want / f.RH < 1.35, `${H}: RH ${f.RH} vs ${want}`);
    const old = H - want - 20 - 10 - 52 - FRAME;
    if (H >= 375) assert.ok(f.h >= old - 3, `${H}: alcove ${f.h} vs old ${old}`);
    assert.ok(f.h > 120, `${H}: alcove tall enough`);
  }
});
