$(document).ready(() => {
  const desktop = $("#desktop");
  const sidebar = new TSidebar(desktop);

  sidebar.view.appendTo(desktop);
});
