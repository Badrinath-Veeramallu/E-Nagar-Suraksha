/**
 * E-Nagar Suraksha — Use Case Diagram Generator
 * ─────────────────────────────────────────────
 * HOW TO RUN:
 *   1. Open StarUML
 *   2. Go to  Tools > Script...
 *   3. Paste the ENTIRE contents of this file
 *   4. Click  Run
 *
 * The diagram will be created and opened automatically.
 */
(function () {
  'use strict';

  /* ── tiny helpers ─────────────────────────────────────────────────── */
  function cm(typeId, parent, name, field) {
    var e = app.factory.createModel({ id: typeId, parent: parent, field: field || 'ownedElements' });
    if (name) e.name = name;
    return e;
  }
  function vActor(dgm, m, x, y) {
    var v = app.factory.createView({ id: 'UMLActorView', parent: dgm, model: m });
    v.left = x; v.top = y; v.width = 48; v.height = 68; return v;
  }
  function vUC(dgm, m, x, y) {
    var v = app.factory.createView({ id: 'UMLUseCaseView', parent: dgm, model: m });
    v.left = x; v.top = y; v.width = 185; v.height = 38; return v;
  }
  function vLink(typeId, dgm, m, tail, head) {
    return app.factory.createView({ id: typeId, parent: dgm, model: m, tail: tail, head: head });
  }

  /* ── model root ───────────────────────────────────────────────────── */
  var proj = app.project.getProject();
  var mdl  = cm('UMLModel',   proj, 'E-Nagar Suraksha');
  var sys  = cm('UMLPackage', mdl,  'E-Nagar Suraksha System');

  /* ── actors ───────────────────────────────────────────────────────── */
  var aCit  = cm('UMLActor', mdl, 'Citizen / User');
  var aAdm  = cm('UMLActor', mdl, 'Admin');
  var aPol  = cm('UMLActor', mdl, 'Police Officer');
  var aMun  = cm('UMLActor', mdl, 'Municipal Officer');
  var aClk  = cm('UMLActor', mdl, 'Clerk Auth Service');
  var aMap  = cm('UMLActor', mdl, 'Map Service (Leaflet/OSM)');
  var aTrn  = cm('UMLActor', mdl, 'Translation Service');

  /* ── use cases ────────────────────────────────────────────────────── */
  // AUTH
  var uc01 = cm('UMLUseCase', sys, 'Register / Sign Up');
  var uc02 = cm('UMLUseCase', sys, 'Login / Authenticate');
  var uc03 = cm('UMLUseCase', sys, 'Update Profile');
  var uc04 = cm('UMLUseCase', sys, 'Switch Language');
  // CITIZEN
  var uc05 = cm('UMLUseCase', sys, 'Submit Complaint');
  var uc06 = cm('UMLUseCase', sys, 'Upload Complaint Photo (optional)');
  var uc07 = cm('UMLUseCase', sys, 'Select Location on Map');
  var uc08 = cm('UMLUseCase', sys, 'View My Complaints');
  var uc09 = cm('UMLUseCase', sys, 'Track Complaint Status');
  var uc10 = cm('UMLUseCase', sys, 'Submit Feedback / Rating');
  var uc11 = cm('UMLUseCase', sys, 'Re-open Complaint');
  var uc12 = cm('UMLUseCase', sys, 'Upvote Complaint');
  var uc13 = cm('UMLUseCase', sys, 'Add Comment (Citizen)');
  var uc14 = cm('UMLUseCase', sys, 'Receive Notifications');
  var uc15 = cm('UMLUseCase', sys, 'Search Complaint (Public)');
  // ADMIN
  var uc16 = cm('UMLUseCase', sys, 'View All Complaints');
  var uc17 = cm('UMLUseCase', sys, 'Monitor Dashboard');
  var uc18 = cm('UMLUseCase', sys, 'View Analytics and Reports');
  var uc19 = cm('UMLUseCase', sys, 'View Audit Logs');
  var uc20 = cm('UMLUseCase', sys, 'Assign / Override Complaint');
  var uc21 = cm('UMLUseCase', sys, 'Create Police Account');
  var uc22 = cm('UMLUseCase', sys, 'Create Municipal Account');
  var uc23 = cm('UMLUseCase', sys, 'Manage Users (Block/Unblock/Delete)');
  var uc24 = cm('UMLUseCase', sys, 'Manage Departments');
  // POLICE
  var uc25 = cm('UMLUseCase', sys, 'View Assigned Complaints (Police)');
  var uc26 = cm('UMLUseCase', sys, 'View Complaint Details (Police)');
  var uc27 = cm('UMLUseCase', sys, 'Update Complaint Status (Police)');
  var uc28 = cm('UMLUseCase', sys, 'Upload Proof Image (optional)');
  var uc29 = cm('UMLUseCase', sys, 'Mark as Resolved (Police)');
  var uc30 = cm('UMLUseCase', sys, 'Add Comment (Police)');
  var uc31 = cm('UMLUseCase', sys, 'Create Police Sub-Officer');
  // MUNICIPAL
  var uc32 = cm('UMLUseCase', sys, 'View Assigned Complaints (Municipal)');
  var uc33 = cm('UMLUseCase', sys, 'View Complaint Details (Municipal)');
  var uc34 = cm('UMLUseCase', sys, 'Update Complaint Status (Municipal)');
  var uc35 = cm('UMLUseCase', sys, 'Upload Resolution Proof (MANDATORY)');
  var uc36 = cm('UMLUseCase', sys, 'Mark as Resolved (Municipal)');
  var uc37 = cm('UMLUseCase', sys, 'Add Comment (Municipal)');
  var uc38 = cm('UMLUseCase', sys, 'Create Municipal Sub-Officer');
  // SYSTEM / INTERNAL
  var uc39 = cm('UMLUseCase', sys, 'Auto-Route Complaint (Police vs Municipal)');
  var uc40 = cm('UMLUseCase', sys, 'Validate Complaint Data');
  var uc41 = cm('UMLUseCase', sys, 'Enforce SLA and Escalation');
  var uc42 = cm('UMLUseCase', sys, 'Send Real-time Notifications');
  var uc43 = cm('UMLUseCase', sys, 'Store and Retrieve Data');
  var uc44 = cm('UMLUseCase', sys, 'Rate Limit Submissions');
  var uc45 = cm('UMLUseCase', sys, 'Check Duplicate Complaints');

  /* ── <<include>> relationships ────────────────────────────────────── */
  function mkInc(includingUC, includedUC) {
    var r = cm('UMLInclude', includingUC, '', 'include');
    r.addition = includedUC; return r;
  }
  var inc01 = mkInc(uc05, uc02);
  var inc02 = mkInc(uc05, uc40);
  var inc03 = mkInc(uc05, uc39);
  var inc04 = mkInc(uc05, uc44);
  var inc05 = mkInc(uc20, uc39);
  var inc06 = mkInc(uc27, uc43);
  var inc07 = mkInc(uc34, uc43);
  var inc08 = mkInc(uc36, uc35);
  var inc09 = mkInc(uc39, uc42);
  var inc10 = mkInc(uc42, uc14);

  /* ── <<extend>> relationships ─────────────────────────────────────── */
  function mkExt(extendingUC, baseUC, cond) {
    var r = cm('UMLExtend', extendingUC, '', 'extend');
    r.extendedCase = baseUC;
    if (cond) r.condition = cond; return r;
  }
  var ext01 = mkExt(uc06, uc05, 'optional for Citizen');
  var ext02 = mkExt(uc10, uc08, 'only when resolved or closed');
  var ext03 = mkExt(uc11, uc08, 'only when status is closed');
  var ext04 = mkExt(uc28, uc27, 'optional for Police');
  var ext05 = mkExt(uc41, uc39, 'when SLA deadline passes');
  var ext06 = mkExt(uc45, uc05, 'geo+keyword duplicate match');

  /* ── actor–usecase associations ───────────────────────────────────── */
  function mkAssoc(actor, usecase) {
    var r = cm('UMLAssociation', mdl, '');
    r.end1.reference = actor; r.end2.reference = usecase; return r;
  }
  var ac = [uc01,uc02,uc03,uc04,uc05,uc07,uc08,uc09,uc12,uc13,uc14,uc15].map(function(u){return mkAssoc(aCit,u);});
  var aa = [uc02,uc03,uc16,uc17,uc18,uc19,uc20,uc21,uc22,uc23,uc24].map(function(u){return mkAssoc(aAdm,u);});
  var ap = [uc02,uc14,uc25,uc26,uc27,uc29,uc30,uc31].map(function(u){return mkAssoc(aPol,u);});
  var am = [uc02,uc14,uc32,uc33,uc34,uc36,uc37,uc38].map(function(u){return mkAssoc(aMun,u);});
  var aClkA = mkAssoc(aClk, uc02);
  var aMapA = mkAssoc(aMap, uc07);
  var aTrnA = mkAssoc(aTrn, uc04);

  /* ── diagram canvas ───────────────────────────────────────────────── */
  var dgm = cm('UMLUseCaseDiagram', mdl, 'Use Case Diagram');

  /* system boundary frame */
  var sbv = app.factory.createView({ id: 'UMLSubjectView', parent: dgm, model: sys });
  sbv.left = 195; sbv.top = 20; sbv.width = 940; sbv.height = 1300;

  /* actor views */
  var vCit = vActor(dgm, aCit,  40,  110);
  var vAdm = vActor(dgm, aAdm,  40,  390);
  var vPol = vActor(dgm, aPol,  40,  720);
  var vMun = vActor(dgm, aMun,  40, 1020);
  var vClk = vActor(dgm, aClk, 1170,  85);
  var vMap = vActor(dgm, aMap, 1170, 370);
  var vTrn = vActor(dgm, aTrn, 1170, 590);

  /* use case views — AUTH row */
  var v01 = vUC(dgm, uc01, 210,  55);
  var v02 = vUC(dgm, uc02, 415,  55);
  var v03 = vUC(dgm, uc03, 625,  55);
  var v04 = vUC(dgm, uc04, 835,  55);

  /* CITIZEN column (x=210) */
  var v05 = vUC(dgm, uc05, 210, 130);
  var v06 = vUC(dgm, uc06, 210, 185);
  var v07 = vUC(dgm, uc07, 210, 240);
  var v08 = vUC(dgm, uc08, 210, 295);
  var v09 = vUC(dgm, uc09, 210, 350);
  var v10 = vUC(dgm, uc10, 210, 405);
  var v11 = vUC(dgm, uc11, 210, 460);
  var v12 = vUC(dgm, uc12, 210, 515);
  var v13 = vUC(dgm, uc13, 210, 570);
  var v14 = vUC(dgm, uc14, 210, 625);
  var v15 = vUC(dgm, uc15, 210, 680);

  /* ADMIN column (x=510) */
  var v16 = vUC(dgm, uc16, 510, 130);
  var v17 = vUC(dgm, uc17, 510, 185);
  var v18 = vUC(dgm, uc18, 510, 240);
  var v19 = vUC(dgm, uc19, 510, 295);
  var v20 = vUC(dgm, uc20, 510, 350);
  var v21 = vUC(dgm, uc21, 510, 405);
  var v22 = vUC(dgm, uc22, 510, 460);
  var v23 = vUC(dgm, uc23, 510, 515);
  var v24 = vUC(dgm, uc24, 510, 570);

  /* POLICE column (x=210, lower) */
  var v25 = vUC(dgm, uc25, 210, 800);
  var v26 = vUC(dgm, uc26, 210, 855);
  var v27 = vUC(dgm, uc27, 210, 910);
  var v28 = vUC(dgm, uc28, 210, 965);
  var v29 = vUC(dgm, uc29, 210,1020);
  var v30 = vUC(dgm, uc30, 210,1075);
  var v31 = vUC(dgm, uc31, 210,1130);

  /* MUNICIPAL column (x=510, lower) */
  var v32 = vUC(dgm, uc32, 510, 800);
  var v33 = vUC(dgm, uc33, 510, 855);
  var v34 = vUC(dgm, uc34, 510, 910);
  var v35 = vUC(dgm, uc35, 510, 965);
  var v36 = vUC(dgm, uc36, 510,1020);
  var v37 = vUC(dgm, uc37, 510,1075);
  var v38 = vUC(dgm, uc38, 510,1130);

  /* SYSTEM/INTERNAL column (x=810) */
  var v39 = vUC(dgm, uc39, 810, 130);
  var v40 = vUC(dgm, uc40, 810, 185);
  var v41 = vUC(dgm, uc41, 810, 240);
  var v42 = vUC(dgm, uc42, 810, 295);
  var v43 = vUC(dgm, uc43, 810, 350);
  var v44 = vUC(dgm, uc44, 810, 405);
  var v45 = vUC(dgm, uc45, 810, 460);

  /* ── include views ────────────────────────────────────────────────── */
  vLink('UMLIncludeView', dgm, inc01, v05, v02);
  vLink('UMLIncludeView', dgm, inc02, v05, v40);
  vLink('UMLIncludeView', dgm, inc03, v05, v39);
  vLink('UMLIncludeView', dgm, inc04, v05, v44);
  vLink('UMLIncludeView', dgm, inc05, v20, v39);
  vLink('UMLIncludeView', dgm, inc06, v27, v43);
  vLink('UMLIncludeView', dgm, inc07, v34, v43);
  vLink('UMLIncludeView', dgm, inc08, v36, v35);
  vLink('UMLIncludeView', dgm, inc09, v39, v42);
  vLink('UMLIncludeView', dgm, inc10, v42, v14);

  /* ── extend views ─────────────────────────────────────────────────── */
  vLink('UMLExtendView', dgm, ext01, v06, v05);
  vLink('UMLExtendView', dgm, ext02, v10, v08);
  vLink('UMLExtendView', dgm, ext03, v11, v08);
  vLink('UMLExtendView', dgm, ext04, v28, v27);
  vLink('UMLExtendView', dgm, ext05, v41, v39);
  vLink('UMLExtendView', dgm, ext06, v45, v05);

  /* ── association views ────────────────────────────────────────────── */
  function aView(aV, ucV, model) {
    vLink('UMLAssociationView', dgm, model, aV, ucV);
  }
  // Citizen
  [v01,v02,v03,v04,v05,v07,v08,v09,v12,v13,v14,v15].forEach(function(v,i){ aView(vCit,v,ac[i]); });
  // Admin
  [v02,v03,v16,v17,v18,v19,v20,v21,v22,v23,v24].forEach(function(v,i){ aView(vAdm,v,aa[i]); });
  // Police
  [v02,v14,v25,v26,v27,v29,v30,v31].forEach(function(v,i){ aView(vPol,v,ap[i]); });
  // Municipal
  [v02,v14,v32,v33,v34,v36,v37,v38].forEach(function(v,i){ aView(vMun,v,am[i]); });
  // External
  aView(vClk, v02, aClkA);
  aView(vMap, v07, aMapA);
  aView(vTrn, v04, aTrnA);

  /* ── open diagram ─────────────────────────────────────────────────── */
  app.diagrams.openDiagram(dgm);
  console.log('✅ Done! 45 use cases | 7 actors | 10 <<include>> | 6 <<extend>>');
}());
