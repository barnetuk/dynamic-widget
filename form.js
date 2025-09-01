function setMinDateTime(showError = false) {
    let now = new Date();

    now.setMinutes(now.getMinutes() + 15);
    now.setSeconds(0, 0);

    let yyyy = now.getFullYear();
    let mm = String(now.getMonth() + 1).padStart(2, '0');
    let dd = String(now.getDate()).padStart(2, '0');
    let today = `${yyyy}-${mm}-${dd}`;

    let hh = String(now.getHours()).padStart(2, '0');
    let min = String(now.getMinutes()).padStart(2, '0');
    let time = `${hh}:${min}`;

    const dateInput = document.getElementById("book_pick_date");
    const timeInput = document.getElementById("book_pick_time");
    const errorBox = document.getElementById("timeError");

    // store timeout globally (ek hi instance use hoga)
    if (!window.errorTimeout) window.errorTimeout = null;

    dateInput.min = today;

    if (dateInput.value === today) {
        timeInput.min = time;

        if (timeInput.value && timeInput.value < time) {
            timeInput.value = time;

            if (showError) {
                let errorTime = timeInput.value;
                errorBox.textContent = `You can select a time from ${errorTime} onwards, but not earlier.`;
                errorBox.style.display = "block";
                timeInput.classList.add("field-error");

                // purana timeout clear karo
                clearTimeout(window.errorTimeout);

                // 3s ke baad hide
                window.errorTimeout = setTimeout(() => {
                    errorBox.style.display = "none";
                    timeInput.classList.remove("field-error");
                }, 3000);
            }
        } else {
            errorBox.style.display = "none";
            timeInput.classList.remove("field-error");
        }
    } else {
        timeInput.min = "00:00";
        errorBox.style.display = "none";
        timeInput.classList.remove("field-error");
    }

    // default values if not changed
    if (!dateInput.dataset.userChanged) {
        dateInput.value = today;
    }
    if (!timeInput.dataset.userChanged) {
        timeInput.value = time;
    }
}

setMinDateTime();

setInterval(() => setMinDateTime(), 30000);

document.getElementById("book_pick_date").addEventListener("input", e => {
    e.target.dataset.userChanged = true;
    setMinDateTime(true);
});
document.getElementById("book_pick_time").addEventListener("input", e => {
    e.target.dataset.userChanged = true;
    setMinDateTime(true);
});

const select = document.getElementById("Passenger");
for (let i = 2; i <= 200; i++) {
  const option = document.createElement("option");
  option.value = i;
  option.textContent = i + " Passengers";
  select.appendChild(option);
}

const hardcodedAddresses = [
  'LONDON HEATHROW AIRPORT TERMINAL 2 | TW6 1EW',
  'LONDON HEATHROW AIRPORT TERMINAL 3 | TW6 1QG',
  'LONDON HEATHROW AIRPORT TERMINAL 4 | TW6 3XA',
  'LONDON HEATHROW AIRPORT TERMINAL 5 | TW6 2GA',
  'LONDON GATWICK AIRPORT NORTH TERMINAL | RH6 0PJ',
  'LONDON GATWICK AIRPORT SOUTH TERMINAL  | RH6 0NP',
  'LONDON CITY AIRPORT | E16 2PX',
  'LONDON STANSTED AIRPORT | CM24 1RW',
  'LONDON LUTON AIRPORT | LU2 9QT'
];

const NON_SELECTABLE_VALUES = ["__info__", "__searching__", "__invalid__"];
let viaCount = 0;
const maxViaFields = 7;

function clearFieldError($field) {
  $field.removeClass("field-error");
  $field.closest(".field").find(".error-msg").remove();
}

function applyAutocomplete($input) {
  $input.autocomplete({
    open: function (event, ui) {
    let input = event.target;
    let rect = input.getBoundingClientRect();

    $(".ui-autocomplete").css({
      top: rect.bottom + window.scrollY + "px",
      left: rect.left + window.scrollX + "px",
      width: rect.width + "px"
    });
  },
    minLength: 0,
    delay: 300,
    source: function (request, response) {
  const term = request.term.trim();
  const remaining = 3 - term.length;

  if (term.length < 3) {
    const infoItem = {
      label: `Please enter ${remaining} more character${remaining === 1 ? '' : 's'} to start searching`,
      value: "__info__"
    };
    const items = [infoItem].concat(
      hardcodedAddresses.map(addr => ({ label: addr, value: addr }))
    );
    response(items);
  } else {
    response([{ label: "Searching...", value: "__searching__" }]);

    $.ajax({
      url: `https://${destnationDomain}/Home/Indextwo`,
      dataType: "json",
      data: { Prefix: term },
      success: function (data) {
        if (Array.isArray(data.list) && data.list.length) {
          const seen = new Set();
          const results = data.list
            .map(item => item.address.trim())
            .filter(addr => {
              const lower = addr.toLowerCase();
              if (seen.has(lower)) return false;
              seen.add(lower);
              return true;
            })
            .map(addr => ({
              label: addr,
              value: addr
            }));
          // const dynamicList = results.concat(
          //   hardcodedAddresses.map(addr => ({ label: addr, value: addr }))
          // );

          response(results);
        } else {
          response([{
            label: `That's odd. We couldn't find any results for "<span>${term}</span>"`,
            value: "__invalid__"
          }]);
        }
      },
      error: function () {
        response([{ label: "Error contacting server", value: "__invalid__" }]);
      }
    });
  }
},
    focus: function (event, ui) {
      if (NON_SELECTABLE_VALUES.includes(ui.item.value)) {
        event.preventDefault();
        return false;
      }
    },
    select: function (event, ui) {
      if (NON_SELECTABLE_VALUES.includes(ui.item.value)) {
        event.preventDefault();
        return false;
      }
      
      $input.val(ui.item.value);
      $input.data("selected", true);
      $input.data("valid", true);
      $input.data("original", ui.item.value);

      clearFieldError($input);
      setTimeout(() => {
        $input.blur();
      }, 0);
    },
    change: function (event, ui) {
      if (!ui.item || NON_SELECTABLE_VALUES.includes(ui.item.value)) {
        $input.data("valid", false);
      }
    }
  });

  $input.autocomplete("instance")._renderItem = function (ul, item) {
    const li = $("<li>");
    const wrapper = $("<div>").addClass("ui-menu-item-wrapper");

    if (item.value === "__searching__") {
      wrapper.html(`<span class="inputListLoaderInner"></span>${item.label}`);
      li.addClass("ui-state-disabled");
      wrapper.addClass("addrSearching")
    }else if(item.value === "__info__"){
      wrapper.html(`${item.label}`);
      li.addClass("ui-state-disabled");
      wrapper.addClass("info-message")
    }else if(item.value === "__invalid__"){
      wrapper.html(`${item.label}`);
      li.addClass("ui-state-disabled");
      wrapper.addClass("invalidInput")
    }else if(hardcodedAddresses.includes(item.label)){
      wrapper.html(`${item.label}`);
      wrapper.addClass("airportList")
    } else if (NON_SELECTABLE_VALUES.includes(item.value)) {
      wrapper.html(item.label);
      li.addClass("ui-state-disabled");
    } else {
      wrapper.html(item.label);
    }

    return li.append(wrapper).appendTo(ul);
  };

  $input.on("focus", function () {
    $(this).autocomplete("search", $(this).val());
    $input.data("focused", true);
  });

  $input.on("blur", function () {
    const $this = $(this);
    const val = $this.val().trim();
    const isValid = $this.data("valid");
    const original = $this.data("original");

    setTimeout(() => {
      if (val === "") {
        $this.val("");
        $this.data("valid", false);
        return;
      }

      const menu = $this.autocomplete("widget");
      const menuItems = menu.find("li").filter(function () {
        const itemData = $(this).data("uiAutocompleteItem");
        return itemData && !NON_SELECTABLE_VALUES.includes(itemData.value);
      });

      if (!isValid && menuItems.length > 0) {
        const firstItem = menuItems.first().data("uiAutocompleteItem");

        if (!hardcodedAddresses.includes(firstItem.value)) {
          $this.val(firstItem.value);
          $this.data("valid", true);
          $this.data("original", firstItem.value);
          clearFieldError($this);
        } else {
          if (original) {
            $this.val(original);
            $this.data("valid", true);
            clearFieldError($this);
          } else {
            $this.val("");
            $this.data("valid", false);
          }
        }
      } else if (!isValid && (!original || NON_SELECTABLE_VALUES.includes(val))) {
        $this.val("");
        $this.data("valid", false);
      } else if (original && val !== original) {
        $this.val(original);
        $this.data("valid", true);
        clearFieldError($this);
      }
    }, 150);
  });

  $input.on("input", function () {
    const val = $(this).val().trim();
    if (val === $(this).data("original")) {
      $(this).data("valid", true);
      clearFieldError($(this)); 
    }
  });
}

$.ui.autocomplete.prototype._move = function (direction, event) {
  if (!this.menu.element.is(":visible")) {
    this.search(null, event);
    return;
  }
  this.menu[direction](event);

  const activeItem = this.menu.active;
  if (
    activeItem &&
    NON_SELECTABLE_VALUES.includes(activeItem.data("ui-autocomplete-item").value)
  ) {
    this._move(direction, event);
  }
};

applyAutocomplete($("#pickup"));
applyAutocomplete($("#dropof"));

function toggleAddButton(){
  if (viaCount >= maxViaFields) {
    $("#add-via").hide();
  }else{
    $("#add-via").show();
  }
}

$("#add-via").on("click", function () {
  if (viaCount >= maxViaFields) return;

  const $lastVia = $("#via-list .fieldInput").last();
  if ($lastVia.length && !$lastVia.val().trim()) {
    $lastVia.focus();
    return;
  }

  viaCount++;

  const $via = $(`
    <div class="field">
      <div class="field-hd">
        <span class="viaFieldHd">Via ${viaCount}</span>
      </div>
      <div class="viaFieldBtnWrap fieldScaleable">
        <input type="text" class="fieldInput viadata" placeholder="Enter Via Location">
        <button type="button" class="removeField">
          <img src="https://dynamic-widget.pages.dev/images/close.png" alt="Cut Via">
        </button>
      </div>
    </div>
  `);

  $("#via-list").append($via);
  applyAutocomplete($via.find("input"));
  toggleAddButton();
});


$(document).on("click", ".removeField", function () {
  viaCount--;
  toggleAddButton();
    $(this).closest(".field").remove();
    $(".field").each(function (index) {
        $(this).find(".viaFieldHd").html("Via "+ index +" ");
    });
});


function validateAddressField($field) {
  if (!$field || !$field.length) return false;

  const val = $field.val().trim();
  const isValid = $field.data("valid");

  $field.removeClass("field-error");
  $field.closest(".field").find(".error-msg").remove();

  if (!val) {
    $field.addClass("field-error");
    $field.closest(".field").append(`<span class="error-msg">This field cannot be empty.</span>`);
    return false;
  }

  if (!isValid) {
    $field.addClass("field-error");
    $field.closest(".field").append(`<span class="error-msg">Please select a valid address from suggestions.</span>`);
    return false;
  }

  return true;
}

// $("#get-quotes").on("click", function (e) {
//   e.preventDefault();
//   let allValid = true;

//   $(".fieldInput").each(function () {
//     const $field = $(this);
//     const isValid = validateAddressField($field);
//     if (!isValid) {
//       allValid = false;
//     }
//   });
// });



function TDate() {
    var ToDate = new Date();
    var userdate = new Date(document.getElementById("book_pick_date").value).toJSON().slice(0, 10);
    var today = new Date().toJSON().slice(0, 10);
    if (userdate < today) {
        alert("Do Not Select the Previous Data");
        document.getElementById("book_pick_date").value = ToDate.getDate();
        $("#book_pick_date").val("");
    } else {
        getTime();
    }
}
function iswaitnreturn(e) {
    if ($(e).val() == "WR") {
        $("#myModalitem").modal({ show: !0, keyboard: !1, backdrop: "static" });
    } else {
        waitingtime = 0;
    }
}
function savewaitnreturn() {
    $("#myModalitem").modal("toggle");
    waitingtime = $("#minwaittime").val();
}
var accuserdb = "";
function addvalue(e) {
    var mytext = $(e).text();
    var mytype = $(e).attr("luggagetype");
    $("#number").val("");
    $("#nameid").val(mytext);
    $("#nametype").val(mytype);
    if (accuserdb.includes(mytext)) {
        var s = accuserdb.split(mytext)[0];
        var ss = s.substr(s.length - 3).trim();
        var ssss = ss[0];
        $("#number").val(ssss);
    }
    $("#moreModalitem").modal("hide");
    $("#itemcount").modal("show");
}
function removeitem(e) {
    var arr = accuserdb.split(",");
    var le = $(e).parent().parent().text().trim();
    var ind = arr.indexOf(le);
    arr.splice(ind, 1);
    accuserdb = arr.join();
    $(e).parent().parent().remove();
}
function additem(e, val, type) {
    var text = e.trim();
    var myid = text.replace(/\s/g, "").replace(/[^\w]/g, "");
    if (accuserdb.includes(text)) {
        var accuser = accuserdb.split(",");
        var tempacc = [];
        accuser.forEach(function (item) {
            if (item.includes(text)) {
                var newVal = parseInt(val);
                var newItem = `${newVal} ${text}`;
                tempacc.push(newItem);
                var myidd = `id_${myid}`;
                $(`#${myidd}`).html(`
                            <input class="form-control holddatainput" data-sendval="${newVal}@${text}" value="${newItem}" disabled data-type="${val} ${type}">
                            <div class="input-group-addon">
                                <button type="button" class="" onclick="removeitem(this)">
                                    <img class="form-icons" src="https://dynamic-widget.pages.dev/images/close.png" alt="luggage delete" width="20">
                                </button>
                            </div>`);
            } else {
                tempacc.push(item);
            }
        });
        accuserdb = tempacc.join(",");
        return;
    }
    insertitem(text, val, type);
}
function insertitem(text, val, type) {
    var myid = text.replace(/\s/g, "").replace(/[^\w]/g, "");
    var newItem = `${val} ${text}`;
    var tag = `
                <div class="col-lg-6 col-12">
                <div class="field-hd">
                              <span>Item Added</span>
                            </div>
                    <div id="id_${myid}" class="dataHoldableWrap" data-type="${val} ${type}">
                        <input class="form-control holddatainput" data-sendval="${val}@${text}" value="${newItem}" disabled data-type="${val} ${type}">
                        <button type="button" class=" del-btn_" onclick="removeitem(this)">
                            <img class="form-icons" src="https://dynamic-widget.pages.dev/images/close.png" alt="luggage delete" width="20">
                        </button>
                    </div>
                </div>`;
    if (!accuserdb.includes(newItem)) {
        if (accuserdb) {
            accuserdb += ",";
        }
        accuserdb += newItem;
    }
    // console.log(accuserdb);
    $("#holdabledata").append(tag);
}
$(".close-luggage").click(function () {
    if ($(".collapse").hasClass("in")) {
        $(".collapse").removeClass("in");
        $(".luggage-btns").addClass("collapsed");
    }
});
function addHoursToDate(date, hours) {
    return new Date(new Date(date).setHours(date.getHours() + hours));
}
// Passenger input change pe error hide kar do
$("#Passenger").on("input change", function () {
  const passengers = parseInt($(this).val(), 10);
  if (!isNaN(passengers) && passengers > 0) {
      $("#passenger-error").hide();
      $("#Passenger").removeClass("field-error");
  }
});

var listvias = [];
var inputsvalues, arrcheckincabin, Array_Luggage_text;
$(document).ready(function () {
    var arr2 = [
        "TV(lessthan30inches)",
        "Ironingboard",
        "Musicspeaker(Large)",
        "Mirror(upto60x36inches)",
        "Rug(upto24x84inches)",
        "SingleMattress",
        "Bedsidetable(45x55cm)",
        "Microwaveoven",
        "Vacuumcleaner",
        "TVstand",
        "Largemusicalinstrumentcase(upto60x24inches)",
        "TV(30to60inches)",
    ];
    $("#get-quotes").click(function (e) {
    e.preventDefault();

    // Pehle address fields ka validation check
    let allValid = true;
    $(".fieldInput").each(function () {
        const $field = $(this);
        const isValid = validateAddressField($field);
        if (!isValid) {
            allValid = false;
        }
    });

    var date = $("#book_pick_date").val();
    var time = $("#book_pick_time").val();
    var d = date + " " + time;
    let myDate = new Date();
    var currrent = addHoursToDate(myDate, 1);

    function toTimestamp(strDate) {
        var datum = Date.parse(strDate);
        return datum / 1000;
    }

    inputsvalues = [];
    itemsValues = [];
    Array_Luggage_text = [];
    arrcheckincabin = [];

    var inputs = $(".holddatainput");
    for (var i = 0; i < inputs.length; i++) {
        itemsValues.push(inputs.data("sendval"));
        inputsvalues.push($(inputs[i]).data("sendval"));
        arrcheckincabin.push($(inputs[i]).data("type"));
    }

    var cabinfinal = 0;
    var checkinfinal = 0;
    var passengerfinal = 0;

    for (var j = 0; j < arrcheckincabin.length; j++) {
        var ret = arrcheckincabin[j].split(" ");
        ret = ret.filter(function (el) {
            return el != null && el != "";
        });
        if (ret[1] == "cabin") {
            cabinfinal += parseInt(ret[0]);
        } else if (ret[1] == "checkin") {
            checkinfinal += parseInt(ret[0]);
        } else if (ret[1] == "passenger") {
            passengerfinal += parseInt(ret[0]);
        }
    }

    var pickup = $("#pickup").val();
    var dropoff = $("#dropof").val();
    var datetxt = $("#book_pick_date").val();
    var hm = time.split(":");
    var hourstxt = hm[0];
    var minutstxt = hm[1];
    var passengers = $("#Passenger").val();
    var TripFlag = $("input[name='journeytype']:checked").val();
    var WaitingMints = $("#minwaittime").val();
    var frmDrNmbr = $("#book_pick_from_doorno").val();
    var toDrNmbr = $("#book_pick_to_doorno").val();

    let listvias = $(".viadata")
        .map((_, el) => el.value.replace(/\|,/g, "@"))
        .get();
    listvias = listvias.filter(function (v) {
        return v !== "";
    });
    let finalList = listvias.join("@");

    passengers = parseFloat(passengers) + parseInt(passengerfinal);

    var isContains = false;
    var obj = [];
    obj.push(cabinfinal);
    obj.push(checkinfinal);
    obj.push(passengers);
    obj.push(datetxt);
    obj.push(hourstxt);
    obj.push(minutstxt);

    // ------------------- IF-ELSE CHAIN -------------------
    if (datetxt == "" || minutstxt == "" || hourstxt == "") {
        alert("ERROR!\nPlease select all things correctly.");
    }
    else if (isNaN(passengers) || passengers <= 0) {
        $("#passenger-error").text("Please select number of passengers").show();
        $("#Passenger").addClass("field-error");
    } 
    else if (!allValid) {
        // Address validation failed
    }
    // else if (TripFlag === "WR") {
    //     // Waiting time validation
    //     const $waitTime = $("#minwaittime");
    //     let waitTimeVal = $waitTime.val().trim();
    //     const $waitError = $("#waittimeError");

    //     if (waitTimeVal === "") {
    //         $waitError.text("Please enter a wait time.").show();
    //         $waitTime.addClass("field-error");
    //         $waitTime.focus();
    //         return; // Stop execution
    //     }

    //     waitTimeVal = parseInt(waitTimeVal, 10);
    //     if (isNaN(waitTimeVal) || waitTimeVal < 1 || waitTimeVal > 60) {
    //         $waitError.text("Wait time must be between 1 and 60 minutes.").show();
    //         $waitTime.addClass("field-error");
    //         $waitTime.focus();
    //         return; // Stop execution
    //     }

    //     $waitTime.removeClass("field-error");
    //     $waitError.hide();
    // }
    else {
        // ✅ All validations passed → proceed
        const url =
          `https://${destnationDomain}/OurVehicle/OurVehicle?luggage_text=` +
          inputsvalues +
          "&pickup=" +
          pickup +
          "&checkurl=" +
          true +
          "&dropoff=" +
          dropoff +
          "&office_details=" +
          office_details +
          "&luggageobject=" +
          obj +
          "&listviasaddress=" +
          `${finalList}` +
          "&tripFlag=" +
          TripFlag +
          "&mints=" +
          WaitingMints +
          "&showVehicle=" +
          isContains +
          "&colorCode=" +
          color_code;

        startProgressBar(url);
    }
});

  
});

function startProgressBar(url) {
  const bar = document.getElementById("progressBar");
  let width = 0;
  bar.style.width = "0%";
  bar.style.display = "block";

  $('.progressBarWrap').show();

  const interval = setInterval(() => {
    if (width < 90) {
      width += Math.random() * 10;
      bar.style.width = width + "%";
    }
  }, 400);

  window.location.href = url;

  $(window).bind("pageshow", function () {
    clearInterval(interval);
    bar.style.width = "100%";
    setTimeout(() => {
      bar.style.display = "none";
      $('.progressBarWrap').hide();
    }, 500);
  });
}

// $("#pickup").select2({
//     placeholder: "Select pickup address",
//     ajax: {
//         url: "https://booking.londontaxi247.co.uk/Home/Indextwo",
//         data: function (data) {
//             return { Prefix: data.term };
//         },
//         processResults: function (response) {
//             return {
//                 results: $.map(response.list, function (obj) {
//                     return { id: obj.address, text: obj.address };
//                 }),
//             };
//         },
//     },
//     minimumInputLength: 3,
// });
// $("#dropof").select2({
//     placeholder: "Select dropoff address",
//     ajax: {
//         url: "https://booking.londontaxi247.co.uk/Home/Indextwo",
//         data: function (data) {
//             return { Prefix: data.term };
//         },
//         processResults: function (response) {
//             return {
//                 results: $.map(response.list, function (obj) {
//                     return { id: obj.address, text: obj.address };
//                 }),
//             };
//         },
//     },
//     minimumInputLength: 3,
// });

$("button").click(function () {
    event.preventDefault();
});
// const popup = document.getElementById("bookingPopup");
// function openPopup() {
//     popup.classList.add("active");
// }
// function closePopup() {
//     popup.classList.remove("active");
// }
// helper function
// function focusAndScroll(inputEl) {
//   if (!inputEl) return;

//   // jab user manually focus kare
//   inputEl.addEventListener("focus", () => {
//     doScroll(inputEl);
//   });
// }

// function doScroll(inputEl) {
//   setTimeout(() => {
//     // mobile/tablet par hi scroll karo
//     if (window.innerWidth <= 768) {
//       if (typeof inputEl.scrollIntoView === "function") {
//         inputEl.scrollIntoView({ behavior: "smooth", block: "center" });
//       } else {
//         const rect = inputEl.getBoundingClientRect();
//         const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
//         window.scrollTo({
//           top: rect.top + scrollTop - window.innerHeight / 2,
//           behavior: "smooth"
//         });
//       }
//     }
//   }, 300);
// }
//   focusAndScroll(document.getElementById("pickup"));

function doScroll(inputEl) {
  setTimeout(() => {
    if (window.innerWidth <= 768) {
      const rect = inputEl.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

      window.scrollTo({
        top: rect.top + scrollTop - 24,
        behavior: "smooth"
      });
    }
  }, 300);
}


// ðŸ‘‡ yahan delegation: sab inputs ke liye chalega
document.addEventListener("focusin", function (e) {
  if (
    e.target.matches("#pickup, #dropof, .viadata, #minwaittime")
  ) {
    doScroll(e.target);
  }
});

  

const WaitnReturn = document.getElementById("waitReturn");
const singleTrip = document.getElementById("single_trip");
const inputWrap = document.getElementById("toggleWaitingTime");

  function toggleInput() {
    function isMobile() {
      return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile/i.test(navigator.userAgent);
    }
    if (WaitnReturn.checked) {
      // inputWrap.style.display = "block";
      inputWrap.classList.add("show");
      
      setTimeout(() => {
        minwaittime.focus();
        doScroll(minwaittime);
      }, 300);

    } else {
      // inputWrap.style.display = "none";
      inputWrap.classList.remove("show");
    }
  }

  // Event listeners
  WaitnReturn.addEventListener("change", toggleInput);
  singleTrip.addEventListener("change", toggleInput);

//   document.addEventListener("focusout", function (e) {
//   if (
//     e.target.matches("#pickup, #dropoff, .viaInput, #minwaittime")
//   ) {
//     e.target.blur();
//   }
// });
const minwaittime = document.getElementById("minwaittime");
const waittimeError = document.getElementById("waittimeError");

minwaittime.setAttribute("inputmode", "numeric");

minwaittime.addEventListener("keypress", function (e) {
  if (!/[0-9]/.test(e.key)) {
    e.preventDefault();
  }
});
minwaittime.addEventListener("input", function (e) {
  let val = e.target.value;

  // Leading zeros remove karna
  val = val.replace(/^0+/, "");

  if (val === "") {
    e.target.value = "";
    waittimeError.style.display = "none";
    minwaittime.classList.remove("field-error");
    return;
  }

  let num = parseInt(val, 10);

  // 60 se zyada na hone dena
  if (num > 60) {
    num = 60;
  }

  e.target.value = num;

  // ✅ Live validation: agar 1-60 ke beech hai → error hide
  if (num >= 1 && num <= 60) {
    waittimeError.style.display = "none";
    minwaittime.classList.remove("field-error");
  }
});
document.querySelectorAll('input[type="date"], input[type="time"]').forEach(input => {
  input.addEventListener("click", () => {
    if (input && typeof input.showPicker === "function") {
      input.showPicker();
    } else {
      input.focus();
    }
  });
});
const dateInput = document.getElementById("book_pick_date");
const dateErrorBox = document.getElementById("dateError");

dateInput.addEventListener("change", function () {
  let today = new Date();
  today.setHours(0, 0, 0, 0);

  let selected = new Date(this.value);

  if (selected < today) {
    let yyyy = today.getFullYear();
    let mm = String(today.getMonth() + 1).padStart(2, "0");
    let dd = String(today.getDate()).padStart(2, "0");
    this.value = `${yyyy}-${mm}-${dd}`;

    dateInput.classList.add("field-error");
    dateErrorBox.style.display = "block";
    setTimeout(() => {
      dateInput.classList.remove("field-error");
      dateErrorBox.style.display = "none";
    }, 3000);
  }
});
  const sploader = document.getElementById("sploader");
  sploader.style.display = "block";

  const APIURL = "https://stationcarslondon.com/api/ItemsAPI/GetItems";

  fetch(APIURL)
    .then(response => response.json())
    .then(response => {
      const markup = response.data;
      const accordion = document.getElementById("accordionExample");

      markup.forEach((person, i) => {
        // Create card element
        const card = document.createElement("div");
        card.className = "card";

        // Card header
        const cardHeader = document.createElement("div");
        cardHeader.className = "card-header";
        cardHeader.setAttribute("role", "tab");
        cardHeader.id = `heading${i}`;

        // const h3 = document.createElement("h3");
        // h3.className = "luggage-headings";

        const btn = document.createElement("button");
        btn.className = "btn collapsed luggage-btns";
        btn.type = "button";
        btn.setAttribute("data-toggle", "collapse");
        btn.setAttribute("data-target", `#collapse${i}`);
        btn.setAttribute("aria-expanded", "false");
        btn.setAttribute("aria-controls", `collapse${i}`);
        btn.textContent = person.ItemName || person.itemname || "Unnamed Item";

        // h3.appendChild(btn);
        cardHeader.appendChild(btn);

        // Card collapse
        const collapse = document.createElement("div");
        collapse.id = `collapse${i}`;
        collapse.className = "collapse";
        collapse.setAttribute("data-parent", "#accordionExample");
        collapse.setAttribute("aria-labelledby", `heading${i}`);

        const cardBody = document.createElement("div");
        cardBody.className = "card-body";

        // Buttons inside card-body
        (person.LineItems || person.itemsubchild || []).forEach((item, idx) => {
          const itemBtn = document.createElement("button");
          itemBtn.type = "button";
          itemBtn.className = "btn luggage-items-btn";
          itemBtn.setAttribute("data-idss", idx);
          itemBtn.setAttribute("luggagetype", item.type || "");
          itemBtn.setAttribute("onclick", "addvalue(this)");
          itemBtn.textContent = item.name || item;

          cardBody.appendChild(itemBtn);
        });

        collapse.appendChild(cardBody);

        // Assemble card
        card.appendChild(cardHeader);
        card.appendChild(collapse);

        accordion.appendChild(card);
      });

      sploader.style.display = "none";
    })
    .catch(error => {
      console.error(error);
      sploader.style.display = "none";
    });