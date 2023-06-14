function getSearchParam(name, params) {
  if (!params) return null
  return params.reduce((total, item) => {
    let newItem

    if (item.startsWith('?')) {
      newItem = item.slice(1)
    } else {
      newItem = item
    }

    if (newItem.startsWith(name)) {
      return newItem.split('=')[1]
    }

    return total
  }, '')
}
const setDataOnSessionStorage = (id, data) => {
  if (Object.keys(data).length > 0) {
    sessionStorage.setItem(id, JSON.stringify(data))
  }
}

const getMarketingData = () => {
  let sessionSearchParams = sessionStorage.getItem('search_params') || window.location.search

  const sourceIdMapping = {
    awin: 'awc',
    bing: 'msclkid',
    facebook: 'fbclid',
    google: 'gclid',
    taboola: 'tclick_id',
    tiktok: 'ttclid',
    linkedin: 'li_fat_id',
    outbrain: 'ob_click_id',
  }

  const marketingData = {}

  if (sessionSearchParams) {
    const searchItems = sessionSearchParams.replace(/\?/g, '').split('&')

    marketingData.utmSource = getSearchParam('utm_source', searchItems) || 'direct'

    marketingData.utmMedium = getSearchParam('utm_medium', searchItems)

    marketingData.utmCampaign = getSearchParam('utm_campaign', searchItems)

    marketingData.utmProduct = getSearchParam('utm_product', searchItems)

    marketingData.utmTerm = getSearchParam('utm_term', searchItems)

    marketingData.utmContent = getSearchParam('utm_content', searchItems)

    marketingData.clickId = getSearchParam(sourceIdMapping[marketingData.utmSource], searchItems)

    marketingData.campaignId = getSearchParam('campaignid', searchItems)

    marketingData.adId = getSearchParam('adid', searchItems)
  }

  setDataOnSessionStorage('marketingData', marketingData)

  return marketingData
}

const defaultFormData = (marketingData) => {
  return {
    createdAt: new Intl.DateTimeFormat('es-ES', { dateStyle: 'short', timeStyle: 'medium' }).format(new Date()).replace(/,/g, ''),
    pagePath: `${window.location.host}${window.location.pathname}`,
    marketingUrl: window.location.href,
    ...(marketingData.utmSource && { utmSource: marketingData.utmSource }),
    ...(marketingData.utmMedium && { utmMedium: marketingData.utmMedium }),
    ...(marketingData.utmCampaign && { utmCampaign: marketingData.utmCampaign }),
    ...(marketingData.utmProduct && { utmProduct: marketingData.utmProduct }),
    ...(marketingData.utmContent && { utmContent: marketingData.utmContent }),
    ...(marketingData.utmTerm && { utmTerm: marketingData.utmTerm }),
    ...(marketingData.clickId && { clickId: marketingData.clickId }),
    ...(marketingData.campaignId && { campaignId: marketingData.campaignId }),
    ...(marketingData.adId && { adId: marketingData.adId }),
    deviceType: screen.width < 481 ? 'm' : screen.width > 788 ? 'c' : 't',
  }
}
// 	FUNTIONALITY TO SEND DATA TO ENDPOINT
function convertFormToJSON(form, marketingData, formId) {
  const array = $(form).serializeArray();
  const json = {};
  $.each(array, function () {
    json[this.name] = this.value || "";
  });
  if(json.prefix && json.phone) {
    json['companyPhone'] = [json.prefix, json.phone].filter(Boolean).join(' ');
    delete json.prefix;
    delete json.phone;
  }
  console.log('json', json)
  return {
    ...json,
    ...(defaultFormData(marketingData)),
    ...(formId && {formId: formId})
  };
}

$('form[data-endpoint]').each(function (
  i,
  el
) {
  let form = $(el);
  form.submit(function (e) {
    e.preventDefault();
    form = $(e.target);
    const marketingData = getMarketingData();
    const formId = form.data('form-id')
    const data = convertFormToJSON(form, marketingData, formId);
    const endpoint = form.data('endpoint');
    const redirectURL = form.data('redirect');
    console.log(`DEBUG data`, data, new Date())

    $.ajax({
      url: endpoint,
      method: "POST",
      data: JSON.stringify(data),
      dataType: "json",
      success: function () {
        const parent = $(form.parent());
        // Hide the form
        parent.children("form").css("display", "none");
        parent.find(".success-text").text(parent.find(".w-form-done").data('successMessage'));
        // Display the "Done" block
        parent.children(".w-form-done").css("display", "block");
        // Redirect to thank you page
        window.location.href = redirectURL;
      },
      error: function () {
        const parent = $(form.parent());
        parent.find(".error-text").text(parent.find(".w-form-fail").data('errorMessage'));
        // Display the "Failed" block
        parent.find(".w-form-fail").css("display", "block");
      },
    });
  });
});
