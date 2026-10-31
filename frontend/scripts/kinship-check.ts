// Made-up family used to check the "How are we related?" names. Run: npm run check:kinship
import { Family } from '../src/album/family';
import { relate } from '../src/album/kinship';
const P = (id: string, gender: string, birthDate: string, extra: any = {}) => ({ id, fullName: id, firstName: id, lastName: '', tamilName: '', gender, birthDate, isDeceased: false, generation: 0, branchId: '', branchName: '', branchNameTamil: '', childIds: [], ...extra });
const ms: any[] = [
  P('Thatha','male','1940-01-01',{generation:1,spouseIds:['Paati']}), P('Paati','female','1945-01-01',{generation:1}),
  P('Ravi','male','1970-01-01',{fatherId:'Thatha',motherId:'Paati',spouseIds:['Lakshmi']}), P('Lakshmi','female','1974-01-01'),
  P('Selvi','female','1968-01-01',{fatherId:'Thatha',motherId:'Paati',spouseIds:['Kumar']}), P('Kumar','male','1965-01-01'),
  P('Mani','male','1972-01-01',{fatherId:'Thatha',motherId:'Paati',spouseIds:['Usha']}), P('Usha','female','1975-01-01'),
  P('Priya','female','1996-01-01',{fatherId:'Ravi',motherId:'Lakshmi'}), P('Arun','male','1999-01-01',{fatherId:'Ravi',motherId:'Lakshmi'}),
  P('Meena','female','1992-01-01',{fatherId:'Kumar',motherId:'Selvi'}), P('Divya','female','2001-01-01',{fatherId:'Mani',motherId:'Usha'}),
  P('Nila','female','2019-01-01',{motherId:'Priya'}),
];
const f = new Family(ms);
const cases: [string,string,string][] = [
  ['Priya','Mani','Chithappa'],['Priya','Usha','Chithi'],['Priya','Selvi','Athai'],['Priya','Kumar','Mama'],['Priya','Thatha','Thatha'],
  ['Priya','Arun','Thambi'],['Arun','Priya','Akka'],['Priya','Divya','Thangai'],['Priya','Meena','Machini'],['Arun','Meena','Machini'],
  ['Mani','Priya','Magal'],['Selvi','Arun','Marumagan'],['Ravi','Lakshmi','Manaivi'],['Lakshmi','Thatha','Mamanar'],['Lakshmi','Mani','Kozhundhan'],
  ['Lakshmi','Selvi','Nathanar'],['Thatha','Lakshmi','Marumagal'],['Thatha','Nila','Kollu Pethi'],['Arun','Lakshmi','Amma'],['Mani','Lakshmi','Anni'],
  ['Meena','Ravi','Mama'],['Meena','Mani','Mama'],
  ['Kumar','Arun','Marumagan'],['Kumar','Priya','Marumagal'],['Lakshmi','Divya','Magal'],['Usha','Meena','Marumagal'],
];
let bad = 0;
for (const [a,b,want] of cases) {
  const r = relate(f, f.get(a)!, f.get(b)!);
  const ok = r?.term === want;
  if (!ok) bad++;
  console.log(ok ? 'ok  ' : 'FAIL', a, '->', b, ':', r?.term, '|', r?.tamil, '|', r?.description);
}
console.log(bad ? `${bad} failed` : 'all passed');
if (bad) process.exit(1);
