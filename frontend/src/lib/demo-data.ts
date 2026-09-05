export const demoUser={name:"Kalpesh",email:"kalpesh@plannora.demo",initials:"KD",mode:"Exam Preparation"};
export const exam={name:"Data Structures Mid-Sem",date:"13 Sep 2026",daysLeft:8,readiness:78,topicsDone:7,topicsTotal:10,remaining:"3h 45m"};
export const subjects=[
 {name:"Data Structures",short:"DS",progress:70,done:7,total:10,next:"Graph Traversal",weak:"Dynamic Programming",topics:[{name:"Graph Traversal",difficulty:"Hard",prep:"Learning",status:"In progress"},{name:"Dynamic Programming",difficulty:"Hard",prep:"Not Started",status:"Scheduled"},{name:"Trees",difficulty:"Easy",prep:"Revision Needed",status:"Scheduled"}]},
 {name:"DBMS",short:"DB",progress:64,done:5,total:8,next:"Transactions",weak:"Transactions",topics:[{name:"Normalization",difficulty:"Medium",prep:"Confident",status:"Completed"},{name:"Transactions",difficulty:"Hard",prep:"Learning",status:"Scheduled"},{name:"Indexing",difficulty:"Medium",prep:"Revision Needed",status:"Upcoming"}]},
 {name:"Operating Systems",short:"OS",progress:58,done:4,total:7,next:"Deadlocks",weak:"CPU Scheduling",topics:[{name:"Deadlocks",difficulty:"Medium",prep:"Learning",status:"Upcoming"},{name:"CPU Scheduling",difficulty:"Hard",prep:"Not Started",status:"Scheduled"},{name:"Memory Management",difficulty:"Easy",prep:"Revision Needed",status:"Completed"}]},
];
export const sessions=[
 {time:"5:30 PM",subject:"DBMS",topic:"Normalization",duration:"45 min",strategy:"Revision",status:"Completed"},
 {time:"7:00 PM",subject:"Data Structures",topic:"Graph Traversal",duration:"45 min",strategy:"Concept + Practice",status:"In progress",priority:true},
 {time:"8:10 PM",subject:"Operating Systems",topic:"Deadlocks",duration:"30 min",strategy:"Concept review",status:"Upcoming"},
 {time:"9:00 PM",subject:"Data Structures",topic:"Quick Recall",duration:"15 min",strategy:"Active recall",status:"Upcoming"},
];
export const weekPlan=["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"].map((day,i)=>({day,total:i===2||i===6?"Rest":i===5?"2h 15m":"1h 30m",sessions:i===2||i===6?[]:[sessions[i%3],sessions[(i+1)%4]].map((s,j)=>({...s,time:j?"8:00 PM":"6:30 PM"}))}));
export const progressWeek=[{day:"Mon",planned:120,done:105},{day:"Tue",planned:90,done:90},{day:"Wed",planned:60,done:35},{day:"Thu",planned:120,done:95},{day:"Fri",planned:90,done:70},{day:"Sat",planned:135,done:125},{day:"Sun",planned:45,done:40}];
