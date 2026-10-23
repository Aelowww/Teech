update public.profiles
set course_year = 'IT - Year ' || substring(course_year from '[1-4]')
where role = 'student'
  and course_year is not null
  and course_year !~ '^IT - Year [1-4]$'
  and course_year ~ '[1-4]';

update public.profiles
set course_year = null
where role = 'student'
  and course_year is not null
  and course_year !~ '^IT - Year [1-4]$';
