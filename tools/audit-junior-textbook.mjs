import assert from 'node:assert/strict';
import fs from 'node:fs';
import {textbook as book} from '../web/junior/textbook-map.mjs';
import {units,unitById,taskById} from '../web/junior/catalog.mjs';
const chapters=new Set(book.chapters.map(c=>c.id)),sources=new Map(book.sources.map(s=>[s.id,s]));
assert.equal(chapters.size,book.chapters.length);
assert.equal(new Set(book.sections.map(s=>s.id)).size,book.sections.length);
for(const s of book.sections){assert(chapters.has(s.chapter));assert(sources.has(s.sourceId));assert.equal(s.page,null,'No page number may be inferred from a resource page');assert.equal(s.verificationStatus,'publisher-label-confirmed');}
const mappedUnits=new Set(),mappedTasks=new Set();
for(const m of book.mappings){assert(!mappedUnits.has(m.unitId),'Duplicate unit mapping');mappedUnits.add(m.unitId);for(const id of m.taskIds){assert(!mappedTasks.has(id),'Task counted twice');mappedTasks.add(id);} const u=unitById.get(m.unitId);assert(u);assert.equal(u.grade,book.grade);assert.equal(u.subject,book.subject);assert(chapters.has(m.chapter));assert.equal(m.status,'candidate-theme-only');for(const id of m.taskIds)assert.equal(taskById.get(id)?.unitId,u.id);assert.equal(u.edition,null,'Candidate mapping must not silently relabel existing lessons');}
const eligibleUnits=units.filter(u=>u.grade===book.grade&&u.subject===book.subject&&u.semester===book.semester);
const unmappedUnits=eligibleUnits.filter(u=>!mappedUnits.has(u.id)).map(u=>u.id);
assert.deepEqual(unmappedUnits,[],'New seven-grade upper math units need an explicit candidate mapping');
const report={unmappedUnits,unitCoverage:book.mappings.map(m=>({unitId:m.unitId,status:m.status,implementedThemes:m.coverage,remainingWork:m.missing})),bookId:book.id,generatedAt:new Date().toISOString(),status:book.verificationStatus,teachingReview:book.reviewStatus,publisherConfirmedSectionLabels:book.sections.length,fullyVerifiedTextbookSections:0,fullyCoveredTextbookSections:0,existingCandidateTasks:book.mappings.reduce((n,m)=>n+m.taskIds.length,0),chapters:book.chapters.map(c=>({...c,candidateUnits:book.mappings.filter(m=>m.chapter===c.id).map(m=>m.unitId)})),sources:book.sources,notes:['章节标题为开发候选，待完整目录原件核对。','配套资源的章节标签核实，不等于版次、教材内容或课程覆盖核实。','缺口为开发清单，不是穷尽的教材知识点目录。']};
fs.writeFileSync(new URL('../docs/junior/textbook-audit.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log(`Textbook audit PASS: ${book.sections.length} publisher labels, ${report.existingCandidateTasks} candidate tasks; full textbook coverage not claimed.`);
